/**
 * 오토파이낸스 진출 유사도 엔진 v2 (similarity.js)
 * 통합 기준 문서(Part 3 정형화) 방법론 + 우리 설계(게이트/킬스위치/카테고리) 결합.
 */
const RULESET = {
  name: "디폴트 v1",
  categoryWeights: { MARKET: 0.25, REGULATORY: 0.25, FINANCIAL: 0.20, SYSTEM: 0.30 },
  thresholds: { entry: 70, systemGate: 50, lowConfidence: 0.6 },
  pctScale: {
    REG_CORP_TAX: 30, REG_WHT_INTEREST: 30, REG_WHT_DIVIDEND: 30,
    MKT_PEN_NEW: 100, MKT_PEN_USED: 100, FIN_CAPTIVE_STRENGTH: 100,
    MKT_NEW_USED_RATIO: 6, _default: 100,
  },
  logUniverse: {
    MKT_CAR_SALES: { min: 1e5, max: 4e6 },
    MKT_AF_SIZE: { min: 1e9, max: 1e11 },
    _default: { min: 1, max: 1e9 },
  },
  dayScale: { REG_NPL_CLASS: 180, REG_LICENSE_PERIOD: 365, _default: 365 },
  monthScale: { FIN_AVG_TERM: 60, _default: 60 },
  itemConf: {
    REG_LICENSE_TYPE: 0.95, REG_FOREIGN_OWNERSHIP: 0.8, REG_RATE_CAP: 0.9, REG_AUTO_INS: 0.9,
    MKT_PEN_NEW: 0.7, MKT_PEN_USED: 0.6, FIN_AVG_RATE: 0.7, MKT_BRAND_TOP10: 0.8,
    SYS_VENDORS: 0.4, SYS_SOL_TYPE: 0.4, SYS_VENDOR_LOCKIN: 0.35, CMP_SYSTEM: 0.3,
    _default: 1.0,
  },
  ordinalMap: {
    SYS_DIGITAL_MATURITY: { levels: { LOW: 0, MEDIUM: 1, MEDIUM_HIGH: 2, HIGH: 3 }, max: 3 },
    MKT_DLR_DIGITAL: { levels: { LOW: 0, MEDIUM: 1, MEDIUM_HIGH: 2, HIGH: 3 }, max: 3 },
    SYS_VENDOR_LOCKIN: { levels: { LOW: 0, MEDIUM: 1, HIGH_SI: 2, HIGH_GROUP_STD: 2, HIGH: 2 }, max: 2 },
  },
};
function simPct(a, b, scale) { return Math.max(0, 100 * (1 - Math.abs(a - b) / scale)); }
function simLog(a, b, uni) {
  if (a <= 0 || b <= 0) return null;
  const lo = Math.log10(uni.min), hi = Math.log10(uni.max);
  const norm = v => Math.min(1, Math.max(0, (Math.log10(v) - lo) / (hi - lo)));
  return 100 * (1 - Math.abs(norm(a) - norm(b)));
}
function simOrdinal(a, b, map) {
  const la = map.levels[a], lb = map.levels[b];
  if (la == null || lb == null) return null;
  return 100 * (1 - Math.abs(la - lb) / map.max);
}
function simJaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  const inter = [...A].filter(x => B.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return uni ? (inter / uni) * 100 : 0;
}
// 의미 매트릭스 (외부 주입). 없으면 토큰매칭 fallback.
function getSemantic() {
  if (typeof SEMANTIC_MATRIX !== "undefined") return SEMANTIC_MATRIX;
  if (typeof globalThis !== "undefined" && globalThis.SEMANTIC_MATRIX) return globalThis.SEMANTIC_MATRIX;
  return {};
}
function semanticLookup(itemId, a, b) {
  if (a === b) return 1.0;
  const m = getSemantic()[itemId];
  if (!m) return null;
  if (m[a] && m[a][b] != null) return m[a][b];
  if (m[b] && m[b][a] != null) return m[b][a];
  return null;
}
function simCategory(a, b, itemId) {
  // 1순위: 의미 매트릭스
  if (itemId) {
    const s = semanticLookup(itemId, a, b);
    if (s != null) return s * 100;
  }
  // fallback: 토큰매칭 (매트릭스 미정의 쌍)
  if (a === b) return 100;
  const ta = String(a).split("_"), tb = String(b).split("_");
  const inter = ta.filter(t => tb.includes(t)).length;
  const uni = new Set([...ta, ...tb]).size;
  return uni ? (inter / uni) * 100 : 0;
}
function simObject(a, b, scale) {
  const keys = Object.keys(a).filter(k => typeof a[k] === "number" && typeof b[k] === "number");
  if (!keys.length) return null;
  const s = keys.map(k => simPct(a[k], b[k], scale));
  return s.reduce((x, y) => x + y, 0) / s.length;
}
function itemSimilarity(item, other) {
  const va = item.value_normalized, vb = other.value_normalized;
  if (va == null || vb == null) return { sim: null, reason: "데이터 공백" };
  const st = item.similarity_type, id = item.catalog_item_id;
  if (st === "REFERENCE") return { sim: null, reason: "참고(제외)" };
  if (st === "BINARY") return { sim: va === vb ? 100 : 0, reason: "binary" };
  if (RULESET.ordinalMap[id] && typeof va === "string") {
    const s = simOrdinal(va, vb, RULESET.ordinalMap[id]);
    if (s != null) return { sim: s, reason: "ordinal" };
  }
  if (st === "CONTINUOUS") {
    if (RULESET.logUniverse[id]) {
      const av = typeof va === "object" ? (va.new ?? va.value_gbp_bn ?? null) : va;
      const bv = typeof vb === "object" ? (vb.new ?? vb.value_gbp_bn ?? null) : vb;
      if (typeof av === "number" && typeof bv === "number") {
        const s = simLog(av, bv, RULESET.logUniverse[id]);
        if (s != null) return { sim: s, reason: "log-minmax" };
      }
    }
    const scale = RULESET.pctScale[id] || RULESET.dayScale[id] || RULESET.monthScale[id] || RULESET.pctScale._default;
    if (typeof va === "number" && typeof vb === "number") return { sim: simPct(va, vb, scale), reason: "pct/num" };
    if (typeof va === "object" && typeof vb === "object") {
      const s = simObject(va, vb, scale);
      return { sim: s, reason: s == null ? "공통지표 없음" : "object-avg" };
    }
    return { sim: null, reason: "타입 불일치" };
  }
  if (st === "CATEGORICAL") {
    if (Array.isArray(va) && Array.isArray(vb)) return { sim: simJaccard(va, vb), reason: "jaccard" };
    return { sim: simCategory(va, vb, id), reason: "category" };
  }
  return { sim: null, reason: "알수없음" };
}
function itemConf(item, other) {
  const base = RULESET.itemConf[item.catalog_item_id] ?? RULESET.itemConf._default;
  const dataCoef = Math.min(item.confidence_coef ?? 1, other.confidence_coef ?? 1);
  return base * dataCoef;
}
function compareCountries(target, base) {
  const baseMap = {};
  base.items.forEach(i => (baseMap[i.catalog_item_id] = i));
  const killswitchHits = [];
  target.items.filter(i => i.is_killswitch).forEach(i => {
    if (i.value_normalized === false) killswitchHits.push(i.name);
  });
  const cats = {};
  const itemDetails = [];
  let confWsum = 0, confDenom = 0;
  target.items.forEach(i => {
    const o = baseMap[i.catalog_item_id];
    if (!o) return;
    const { sim, reason } = itemSimilarity(i, o);
    const conf = itemConf(i, o);
    itemDetails.push({ id: i.catalog_item_id, name: i.name, category: i.category_id, sim: round1(sim), conf: round2(conf), reason });
    if (sim == null) return;
    const c = (cats[i.category_id] ||= { wsum: 0, csum: 0, n: 0 });
    c.wsum += sim * conf; c.csum += conf; c.n += 1;
    const w = RULESET.categoryWeights[i.category_id] ?? 0;
    confWsum += w * conf; confDenom += w;
  });
  const categoryScores = {};
  for (const [cat, c] of Object.entries(cats)) categoryScores[cat] = c.csum > 0 ? c.wsum / c.csum : null;
  const sysScore = categoryScores.SYSTEM ?? 0;
  const gatePassed = sysScore >= RULESET.thresholds.systemGate;
  let total = 0, wused = 0;
  for (const [cat, w] of Object.entries(RULESET.categoryWeights))
    if (categoryScores[cat] != null) { total += categoryScores[cat] * w; wused += w; }
  total = wused > 0 ? total / wused : 0;
  const effConf = confDenom > 0 ? confWsum / confDenom : 0;
  const lowConfFlag = effConf < RULESET.thresholds.lowConfidence;
  let verdict;
  if (killswitchHits.length > 0) verdict = "BLOCKED";
  else if (!gatePassed) verdict = "DEEP_RESEARCH";
  else if (total >= RULESET.thresholds.entry) verdict = "TRANSPLANTABLE";
  else verdict = "DEEP_RESEARCH";
  const costRatio = verdict === "TRANSPLANTABLE" ? costFromSimilarity(total) : null;
  return {
    target: target.country_name, base: base.country_name,
    total: round1(total), categoryScores: mapRound(categoryScores),
    gatePassed, killswitchHits, verdict, costRatio,
    effConf: round2(effConf), lowConfFlag, itemDetails,
  };
}
function costFromSimilarity(sim) {
  if (sim >= 90) return 0.35;
  if (sim >= 80) return 0.48;
  if (sim >= 70) return 0.62;
  return null;
}
const round1 = x => x == null ? null : Math.round(x * 10) / 10;
const round2 = x => x == null ? null : Math.round(x * 100) / 100;
const mapRound = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, round1(v)]));
function printReport(r) {
  const L = [];
  L.push(`\n===== ${r.target} <- 비교(진출)국 ${r.base} =====`);
  L.push(`룰셋: ${RULESET.name}`);
  L.push(`\n[카테고리별 유사도 (conf 가중)]`);
  for (const [cat, sc] of Object.entries(r.categoryScores)) {
    const w = RULESET.categoryWeights[cat] * 100 + "%";
    const gate = cat === "SYSTEM" ? `  [게이트${RULESET.thresholds.systemGate} ${r.gatePassed ? "PASS" : "FAIL"}]` : "";
    L.push(`  ${cat.padEnd(11)} ${String(sc).padStart(5)} /100 (w ${w})${gate}`);
  }
  L.push(`\n[킬스위치] ${r.killswitchHits.length ? "X " + r.killswitchHits.join(", ") : "전부 통과 OK"}`);
  L.push(`[시스템 게이트] ${r.gatePassed ? "통과 OK" : "미달 X"}`);
  L.push(`[유효신뢰도] ${r.effConf} ${r.lowConfFlag ? "(저신뢰: 단독 의사결정 금지)" : "OK"}`);
  L.push(`\n>>> 종합 유사도: ${r.total} /100`);
  L.push(`>>> 판정: ${r.verdict}`);
  if (r.costRatio != null) L.push(`>>> 추정비용: 비교국 대비 ${Math.round(r.costRatio * 100)}% (절감 ${Math.round((1 - r.costRatio) * 100)}%)`);
  const gaps = r.itemDetails.filter(d => d.sim == null && d.reason === "데이터 공백");
  L.push(`\n[공백 ${gaps.length}개] ${gaps.map(g => g.name).join(", ") || "없음"}`);
  return L.join("\n");
}
if (typeof module !== "undefined" && require.main === module) {
  const fs = require("fs");
  const path = require("path");
  const DATA = path.join(__dirname, "..", "data");
  // 국가 데이터는 코드별 파일(GB.json/PL.json)로 분리 저장
  const uk = JSON.parse(fs.readFileSync(path.join(DATA, "GB.json"), "utf8"));
  const pl = JSON.parse(fs.readFileSync(path.join(DATA, "PL.json"), "utf8"));
  console.log(printReport(compareCountries(pl, uk)));
}
if (typeof window !== "undefined") {
  window.SimilarityEngine = { compareCountries, printReport, RULESET, itemSimilarity };
}
