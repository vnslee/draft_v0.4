/**
 * popups.js — P1(권역 요약) / P2(국가 요약) / P3(프로그레스 모달)
 * stitch_/p1, p2, p3 디자인 기준. P2는 engine 실제 점수를 표시한다.
 */
(function () {
  const t = (x) => (window.I18n ? window.I18n.t(x) : x);
  const nameOf = (meta) => (window.I18n && window.I18n.lang === "en" ? meta.name : meta.name_ko);

  const VERDICT_KO = {
    TRANSPLANTABLE: "이식·확장 가능",
    DEEP_RESEARCH: "심층조사 권고",
    BLOCKED: "진출 불가",
  };
  const VERDICT_COLOR = {
    TRANSPLANTABLE: "#006242",
    DEEP_RESEARCH: "#b88324",
    BLOCKED: "#ba1a1a",
  };

  function close() {
    document.getElementById("popup-root").innerHTML = "";
  }

  /** P1 — 권역 요약 팝업. region: Geo.REGIONS 항목 */
  function showRegion(region) {
    const entered = window.Store.countriesByRegion(region.id).filter((c) => c.role === "base");
    const planned = window.Store.countriesByRegion(region.id).filter((c) => c.role !== "base");

    // 진출 예정국 quick-win 점수 산출 → 순위
    const ranked = planned
      .map((c) => {
        const r = window.Store.analyze(c.code);
        return { meta: c, result: r, total: r ? r.total : null };
      })
      .sort((a, b) => (b.total ?? -1) - (a.total ?? -1));

    const regName = window.I18n && window.I18n.lang === "en" ? region.name_en : region.name_ko;
    const enteredChips = entered.length
      ? entered.map((c) => `<span class="px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-sm">${nameOf(c)}</span>`).join("")
      : `<span class="text-sm text-outline">${t("진출 완료")} 0</span>`;

    const top = ranked[0];
    const plannedBlock = top
      ? `
      <div class="space-y-md pt-md border-t border-outline-variant">
        <div class="flex justify-between items-end">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-tertiary-container text-[20px]">analytics</span>
            <h3 class="font-body-bold text-on-surface">${t("진출 예정")}: ${nameOf(top.meta)}</h3>
          </div>
          <span class="text-label-caps text-tertiary-container bg-on-tertiary-container/30 px-2 py-0.5 rounded">QUICK-WIN #1</span>
        </div>
        <div class="grid grid-cols-2 gap-md">
          ${statCard("IT READINESS", fmt(top.result && top.result.categoryScores.SYSTEM), "/100", "#004ac6", pct(top.result && top.result.categoryScores.SYSTEM))}
          ${statCard("BIZ DIFFICULTY", bizDifficulty(top.result), "", "#ba1a1a")}
          <div class="col-span-2 p-md bg-primary-container text-on-primary-container rounded-lg shadow-md flex justify-between items-center relative overflow-hidden">
            <div class="relative z-10">
              <span class="text-label-caps opacity-80">${t("종합 유사도")}</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-display-lg text-[40px] leading-tight font-black">${fmt(top.total)}</span>
                <span class="text-on-tertiary-container text-sm font-body-bold">${gradeLabel(top.total)}</span>
              </div>
            </div>
            <span class="material-symbols-outlined text-[64px] absolute -right-4 -bottom-4 opacity-10">insights</span>
          </div>
        </div>
      </div>`
      : `<div class="pt-md border-t border-outline-variant text-sm text-outline">${t("진출 예정")} —</div>`;

    render(`
      <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 backdrop-blur-[2px]" onclick="if(event.target===this)Popups.close()">
        <div class="w-[420px] max-w-[90vw] double-bezel rounded-xl overflow-hidden pop-in">
          <div class="double-bezel-inner rounded-[11px] p-lg flex flex-col gap-lg">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-label-caps text-outline block mb-1">REGION PROFILE</span>
                <h2 class="font-headline-md text-on-surface">${regName}</h2>
              </div>
              <button class="text-on-surface-variant hover:text-error transition-colors p-1" onclick="Popups.close()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="space-y-md">
              <div class="flex items-center gap-sm">
                <span class="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                <h3 class="font-body-bold text-on-surface">${t("진출 완료")}</h3>
              </div>
              <div class="flex flex-wrap gap-xs">${enteredChips}</div>
            </div>
            ${plannedBlock}
            <div class="flex justify-end pt-sm">
              <button class="flex items-center gap-sm px-lg py-3 bg-primary text-white rounded-full font-body-bold hover:bg-on-primary-fixed-variant transition-all active:scale-95 group" onclick="Popups.close();App.go('region')">
                ${t("상세보기")}
                <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"><span class="material-symbols-outlined text-white text-[16px]">arrow_forward</span></div>
              </button>
            </div>
          </div>
        </div>
      </div>`);
  }

  /** P2 — 국가 요약 팝업. meta: index.json 국가 메타 */
  function showCountry(meta) {
    const r = window.Store.analyze(meta.code);
    const isBase = meta.role === "base";
    const verdict = r ? r.verdict : null;
    const vColor = verdict ? VERDICT_COLOR[verdict] : "#575d78";
    const flagBox = `<div class="w-12 h-8 rounded-sm overflow-hidden border border-outline-variant bg-surface-variant flex items-center justify-center text-2xl">${meta.flag || "🏳️"}</div>`;

    const statusBadge = isBase
      ? `<span class="px-sm py-xs bg-tertiary-container text-on-tertiary-container text-[12px] font-bold rounded-full">${t("진출 완료")}</span>`
      : `<span class="px-sm py-xs text-[12px] font-bold rounded-full" style="background:${vColor}1a;color:${vColor}">${verdict ? t(VERDICT_KO[verdict]) : t("진출 예정")}</span>`;

    const scoreBlock = r
      ? `
        <div class="grid grid-cols-2 gap-md">
          <div class="p-md bg-surface-container-low rounded-lg border border-outline-variant/30">
            <p class="text-label-caps text-outline mb-xs">${t("종합 유사도")}</p>
            <div class="flex items-end gap-xs"><span class="font-display-lg text-[32px] leading-none" style="color:${vColor}">${fmt(r.total)}</span><span class="text-on-surface-variant text-sm mb-1">/100</span></div>
          </div>
          <div class="p-md bg-surface-container-low rounded-lg border border-outline-variant/30">
            <p class="text-label-caps text-outline mb-xs">${t("시스템 게이트")}</p>
            <div class="flex items-center gap-xs">
              <span class="w-2 h-2 rounded-full" style="background:${r.gatePassed ? "#006242" : "#ba1a1a"}"></span>
              <span class="font-body-bold" style="color:${r.gatePassed ? "#006242" : "#ba1a1a"}">${r.gatePassed ? t("통과") : t("미달")} (${fmt(r.categoryScores.SYSTEM)})</span>
            </div>
          </div>
        </div>`
      : `<div class="p-md bg-surface-container-low rounded-lg border border-outline-variant/30 text-sm text-outline">${t("비교국")}: ${window.Store.base ? window.Store.base.country_name : "—"} · 기준(진출국)</div>`;

    render(`
      <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 backdrop-blur-[2px]" onclick="if(event.target===this)Popups.close()">
        <div class="w-full max-w-[460px] double-bezel rounded-xl overflow-hidden pop-in">
          <div class="double-bezel-inner p-xl flex flex-col gap-lg">
            <div class="flex items-center justify-between border-b border-outline-variant pb-md">
              <div class="flex items-center gap-md">
                ${flagBox}
                <div class="flex flex-col">
                  <div class="flex items-center gap-xs">
                    <h2 class="font-headline-md text-on-surface">${nameOf(meta)}</h2>
                    <span class="text-on-surface-variant text-sm opacity-60">${meta.code}</span>
                  </div>
                  <span class="text-on-surface-variant text-label-caps">${meta.name}</span>
                </div>
              </div>
              <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors" onclick="Popups.close()">
                <span class="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            <div class="flex items-center justify-between p-md bg-surface-container-low rounded-lg border border-outline-variant/30">
              <div class="flex items-center gap-sm">
                <span class="material-symbols-outlined text-primary" style="font-variation-settings:'FILL' 1">login</span>
                <span class="font-body-bold text-on-surface-variant">${t("진출 완료")} / ${t("진출 예정")}</span>
              </div>
              ${statusBadge}
            </div>
            ${scoreBlock}
            <div class="flex justify-end pt-md border-t border-outline-variant">
              <button class="group flex items-center gap-md bg-primary text-on-primary px-lg py-md rounded-full font-body-bold hover:bg-primary-container transition-all shadow-md" onclick="Popups.close();App.go('country','${meta.code}')">
                <span>${t("상세보기")}</span>
                <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">arrow_forward</span></div>
              </button>
            </div>
          </div>
        </div>
      </div>`);
  }

  // ===== 헬퍼 =====
  function render(html) { document.getElementById("popup-root").innerHTML = html; }
  function statCard(label, val, suffix, color, barPct) {
    const bar = barPct != null ? `<div class="w-full h-1 bg-outline-variant rounded-full mt-2 overflow-hidden"><div class="h-full shimmer" style="width:${barPct}%;background:${color}"></div></div>` : "";
    return `<div class="p-md bg-surface-container rounded-lg border border-white/40 shadow-sm flex flex-col gap-1">
      <span class="text-label-caps text-outline">${label}</span>
      <div class="flex items-baseline gap-1"><span class="font-stat-lg text-stat-lg" style="color:${color}">${val}</span><span class="text-sm text-outline">${suffix}</span></div>${bar}</div>`;
  }
  function fmt(v) { return v == null ? "—" : (Math.round(v * 10) / 10); }
  function pct(v) { return v == null ? 0 : Math.max(0, Math.min(100, v)); }
  function gradeLabel(v) {
    if (v == null) return "—";
    if (v >= 80) return "Excellent";
    if (v >= 70) return "Good";
    if (v >= 50) return "Fair";
    return "Low";
  }
  function bizDifficulty(r) {
    if (!r) return "—";
    if (!r.gatePassed || r.killswitchHits.length) return "High";
    if (r.total >= 70) return "Low";
    return "Mid";
  }

  /** P4 — 가중치 룰셋 선택 팝업. scope: {kind, code|regionId, name} (실행 시 P3로 전달) */
  function showRuleset(scope) {
    p4state.scope = scope || null;
    const list = window.Store.rulesetList();
    p4state.selectedId = list[0].id;
    const options = list.map((r) => `<option value="${r.id}">${r.name}</option>`).join("");
    render(`
      <div class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm" onclick="if(event.target===this)Popups.close()">
        <div class="w-[520px] max-w-[90vw] double-bezel rounded-xl overflow-hidden pop-in">
          <div class="double-bezel-inner p-xl flex flex-col gap-lg">
            <div class="flex justify-between items-start">
              <div><h2 class="font-headline-md text-on-surface">${t("가중치 룰셋 설정")}</h2>
                <p class="text-on-surface-variant text-sm">${t("진단에 적용할 가중치 기준을 선택하세요.")}</p></div>
              <button class="text-outline hover:text-on-surface transition-colors" onclick="Popups.close()"><span class="material-symbols-outlined">close</span></button>
            </div>
            <div>
              <label class="text-label-caps text-on-surface-variant mb-xs block">${t("룰셋 선택")}</label>
              <select id="p4-ruleset" class="w-full h-14 px-md bg-surface-container-low border border-outline-variant rounded-xl font-body-bold text-on-surface cursor-pointer" onchange="Popups.onP4Select(this.value)">${options}</select>
            </div>
            <div>
              <label class="text-label-caps text-on-surface-variant mb-xs block">${t("룰셋 세부 가중치")}</label>
              <div class="bg-surface-container rounded-xl p-md border border-outline-variant space-y-md" id="p4-weights"></div>
            </div>
            <div class="flex justify-end pt-sm">
              <button class="h-14 px-xl bg-primary text-on-primary rounded-full font-body-bold flex items-center gap-sm hover:bg-primary-container transition-all active:scale-95" onclick="Popups.runRuleset()">
                ${t("실행")}<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">play_arrow</span></button>
            </div>
          </div>
        </div>
      </div>`);
    renderP4Weights();
  }
  function renderP4Weights() {
    const rs = window.Store.rulesetList().find((r) => r.id === p4state.selectedId);
    const box = document.getElementById("p4-weights");
    if (!box || !rs) return;
    const CAT_COLOR = { MARKET: "#004ac6", REGULATORY: "#006242", FINANCIAL: "#b88324", SYSTEM: "#2563eb" };
    box.innerHTML = window.Store.CATEGORY_ORDER.map((c) => {
      const pct = Math.round(rs.categoryWeights[c] * 100);
      return `<div class="space-y-xs"><div class="flex justify-between items-center">
        <span class="text-on-surface">${t(window.Store.CATEGORY_KO[c])}</span><span class="font-body-bold" style="color:${CAT_COLOR[c]}">${pct}%</span></div>
        <div class="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden"><div class="h-full rounded-full transition-all duration-500" style="width:${pct}%;background:${CAT_COLOR[c]}"></div></div></div>`;
    }).join("");
  }
  function onP4Select(id) { p4state.selectedId = id; renderP4Weights(); }
  function runRuleset() {
    const rs = window.Store.rulesetList().find((r) => r.id === p4state.selectedId);
    if (rs) window.Store.applyRuleset(rs);
    const scope = p4state.scope || { kind: "country", code: (window.Store.plannedCountries()[0] || {}).code, name: (window.Store.plannedCountries()[0] || {}).name_ko };
    close();
    window.App.startProgress(scope);
  }
  const p4state = { scope: null, selectedId: "default" };

  window.Popups = { showRegion, showCountry, showRuleset, onP4Select, runRuleset, close };
})();
