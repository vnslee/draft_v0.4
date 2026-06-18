/**
 * store.js — 데이터 로딩 + 엔진 연결
 * data/index.json(설정·국가목록), 국가별 {code}.json, catalog_items.json을 로드하고
 * engine/similarity.js(window.SimilarityEngine)로 실제 유사도를 계산한다.
 */
(function () {
  const DATA = "../data";

  const state = {
    index: null,        // index.json
    catalog: null,      // catalog_items.json
    countries: {},      // code -> 국가 데이터 JSON
    base: null,         // 진출국(베이스) 데이터
    resultCache: {},    // code -> 분석 결과
  };

  async function getJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`데이터 로드 실패: ${path} (${res.status})`);
    return res.json();
  }

  async function init() {
    state.index = await getJSON(`${DATA}/index.json`);
    state.catalog = await getJSON(`${DATA}/catalog_items.json`).catch(() => null);

    // 모든 국가 데이터 병렬 로드
    await Promise.all(
      state.index.countries.map(async (c) => {
        try {
          state.countries[c.code] = await getJSON(`${DATA}/${c.code}.json`);
        } catch (e) {
          state.countries[c.code] = null; // 데이터 미보유 국가
        }
      })
    );

    const baseCode = state.index.base_default;
    state.base = state.countries[baseCode] || null;
    return state;
  }

  /** index.json의 국가 메타(코드/이름/권역/role/flag) */
  function countryMeta(code) {
    return state.index.countries.find((c) => c.code === code) || null;
  }

  function enteredCountries() {
    return state.index.countries.filter((c) => c.role === "base");
  }
  function plannedCountries() {
    return state.index.countries.filter((c) => c.role !== "base");
  }
  function countriesByRegion(regionId) {
    const alias = (window.Geo && window.Geo.REGION_ALIAS) || {};
    return state.index.countries.filter((c) => (alias[c.region] || c.region) === regionId);
  }

  /**
   * 대상국 vs 베이스(진출국) 유사도 분석. engine 호출.
   * 데이터 없거나 베이스 자신이면 null.
   */
  function analyze(targetCode) {
    if (state.resultCache[targetCode]) return state.resultCache[targetCode];
    const target = state.countries[targetCode];
    const base = state.base;
    if (!target || !base || target === base) return null;
    if (!window.SimilarityEngine) throw new Error("엔진(SimilarityEngine) 미로드");
    const r = window.SimilarityEngine.compareCountries(target, base);
    state.resultCache[targetCode] = r;
    return r;
  }

  const CATEGORY_KO = { MARKET: "시장", REGULATORY: "규제", FINANCIAL: "환경(금융)", SYSTEM: "시스템" };
  const CATEGORY_ORDER = ["MARKET", "REGULATORY", "FINANCIAL", "SYSTEM"];

  /** 분석 결과의 itemDetails를 카테고리별로 묶고, 원본 항목(출처 등)과 합친다. */
  function itemsByCategory(targetCode) {
    const r = analyze(targetCode);
    if (!r) return null;
    const target = state.countries[targetCode];
    const byId = {};
    target.items.forEach((i) => (byId[i.catalog_item_id] = i));
    const groups = {};
    CATEGORY_ORDER.forEach((c) => (groups[c] = []));
    r.itemDetails.forEach((d) => {
      const src = byId[d.id] || {};
      (groups[d.category] = groups[d.category] || []).push({
        ...d,
        source_tier: src.source_tier,
        source_detail: src.source_detail || src.source_name,
        official_gap_flag: src.official_gap_flag,
        value_raw: src.value_raw,
        is_killswitch: src.is_killswitch,
      });
    });
    return groups;
  }

  // ===== 룰셋 관리 (M6) =====
  const TIER_TO_GRADE = { TIER1: "OFFICIAL", TIER2: "SEMI_OFFICIAL", TIER3: "ESTIMATED", BLOCKED: "NONE" };

  /** 현재 엔진 룰셋을 화면 편집용 객체로 추출 */
  function currentRuleset() {
    const R = window.SimilarityEngine.RULESET;
    return {
      name: R.name,
      categoryWeights: { ...R.categoryWeights },
      thresholds: { ...R.thresholds },
      tierCoef: R.tierCoef ? { ...R.tierCoef } : { TIER1: 1.0, TIER2: 0.8, TIER3: 0.5 },
    };
  }

  /** 저장된 커스텀 룰셋 목록(localStorage) + 디폴트 */
  function rulesetList() {
    const custom = JSON.parse(localStorage.getItem("rulesets") || "[]");
    return [{ id: "default", name: "디폴트 v1", ...defaultRulesetBody() }, ...custom];
  }
  function defaultRulesetBody() {
    return {
      categoryWeights: { MARKET: 0.25, REGULATORY: 0.25, FINANCIAL: 0.2, SYSTEM: 0.3 },
      thresholds: { entry: 70, systemGate: 50, lowConfidence: 0.6 },
      tierCoef: { TIER1: 1.0, TIER2: 0.8, TIER3: 0.5 },
    };
  }

  /**
   * 룰셋을 엔진에 적용하고 캐시를 비운다(재계산 유도).
   * tierCoef를 각 국가 항목의 confidence_coef에 source_tier 기준으로 재매핑한다.
   */
  function applyRuleset(rs) {
    const R = window.SimilarityEngine.RULESET;
    if (rs.categoryWeights) R.categoryWeights = { ...rs.categoryWeights };
    if (rs.thresholds) R.thresholds = { ...R.thresholds, ...rs.thresholds };
    if (rs.name) R.name = rs.name;
    if (rs.tierCoef) {
      R.tierCoef = { ...rs.tierCoef };
      // 모든 국가 항목의 confidence_coef를 tier 기준으로 갱신
      Object.values(state.countries).forEach((c) => {
        if (!c || !c.items) return;
        c.items.forEach((i) => {
          const coef = rs.tierCoef[i.source_tier];
          if (coef != null) i.confidence_coef = coef;
        });
      });
    }
    state.resultCache = {}; // 재계산
  }

  /** 새 룰셋 버전을 localStorage에 저장하고 적용 */
  function saveRuleset(name, body) {
    const custom = JSON.parse(localStorage.getItem("rulesets") || "[]");
    const id = "rs_" + (custom.length + 1) + "_" + name.replace(/\s+/g, "_");
    const entry = { id, name, ...body };
    custom.push(entry);
    localStorage.setItem("rulesets", JSON.stringify(custom));
    applyRuleset(entry);
    return entry;
  }

  /** 권역 순위 (기능2): 권역 내 미진출국을 종합점수 기준 정렬 + 카테고리 분해 */
  function regionRanking(regionId) {
    const planned = countriesByRegion(regionId).filter((c) => c.role !== "base");
    const rows = planned
      .map((c) => {
        const r = analyze(c.code);
        return r ? { meta: c, result: r, total: r.total } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.total - a.total)
      .map((x, i) => ({ ...x, rank: i + 1 }));
    const entered = countriesByRegion(regionId).filter((c) => c.role === "base");
    return { rows, entered, regionId };
  }

  /** 비용 구간표(설계서 6.4) */
  function costTable() {
    return [
      { range: "90% 이상", ratio: "30~40%", meaning: "거의 그대로 이식" },
      { range: "80~90%", ratio: "40~55%", meaning: "소폭 확장" },
      { range: "70~80%", ratio: "55~70%", meaning: "부분 재구축" },
      { range: "70% 미만", ratio: "—", meaning: "이식 부적합, 심층조사 전환" },
    ];
  }

  window.Store = {
    init,
    get index() { return state.index; },
    get base() { return state.base; },
    get countries() { return state.countries; },
    CATEGORY_KO, CATEGORY_ORDER,
    countryMeta,
    enteredCountries,
    plannedCountries,
    countriesByRegion,
    analyze,
    itemsByCategory,
    regionRanking,
    costTable,
    currentRuleset,
    rulesetList,
    applyRuleset,
    saveRuleset,
  };
})();
