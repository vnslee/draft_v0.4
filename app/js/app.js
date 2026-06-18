/**
 * app.js — 앱 컨트롤러 (초기화 / 라우터 / 메인 인터랙션 / P3 프로그레스)
 */
(function () {
  const t = (x) => (window.I18n ? window.I18n.t(x) : x);

  const AGENTS = [
    { key: "market", icon: "analytics", ko: "시장", desc: "인구 및 구매력 분석" },
    { key: "regulation", icon: "gavel", ko: "규제", desc: "법률 및 인허가 리스크" },
    { key: "product", icon: "inventory_2", ko: "상품", desc: "경쟁 제품 매칭도 분석" },
    { key: "system", icon: "hub", ko: "시스템", desc: "공급망 인프라 연동 분석" },
  ];

  const state = {
    screen: "main",
    activeScope: null, // {kind:'country'|'region', code/region, name}
    progress: null,
  };

  // ===== 초기화 =====
  async function init() {
    syncLangButtons();
    window.addEventListener("langchange", () => { syncLangButtons(); rerender(); });

    try {
      await window.Store.init();
    } catch (e) {
      document.getElementById("map-root").innerHTML =
        `<div class="flex items-center justify-center h-full text-error p-8 text-center">데이터 로드 실패: ${e.message}<br/><span class="text-sm text-secondary">로컬 서버에서 실행하세요 (file:// 불가)</span></div>`;
      return;
    }

    renderStats();
    renderRegionDropdown();
    await initMap();
    window.I18n.applyDom();
  }

  function renderStats() {
    document.getElementById("stat-entered").textContent = window.Store.enteredCountries().length;
    document.getElementById("stat-planned").textContent = window.Store.plannedCountries().length;
  }

  function renderRegionDropdown() {
    const ul = document.getElementById("region-list");
    const items = [{ id: "__all__", name_ko: "전체 보기", name_en: "Global Overview" }, ...window.Geo.regionList()];
    ul.innerHTML = items
      .map((r) => {
        const name = window.I18n.lang === "en" ? r.name_en : r.name_ko;
        return `<li><button class="w-full text-left px-md py-3 hover:bg-primary/5 transition-colors text-sm" onclick="App.selectRegion('${r.id}')">${name}</button></li>`;
      })
      .join("");
  }

  async function initMap() {
    await window.WorldMap.init("map-root", {});
    renderMarkers();
  }

  function renderMarkers() {
    const markers = window.Store.index.countries
      .map((c) => {
        const ll = window.Geo.capital(c.code);
        if (!ll) return null;
        const r = c.role === "base" ? null : window.Store.analyze(c.code);
        return {
          code: c.code,
          name_ko: c.name_ko,
          name_en: c.name,
          lonlat: ll,
          entered: c.role === "base",
          score: r ? Math.round(r.total * 10) / 10 : null,
          onClick: () => window.Popups.showCountry(c),
        };
      })
      .filter(Boolean);
    window.WorldMap.renderMarkers(markers);
  }

  // ===== 라우터 =====
  function go(screen, arg) {
    state.screen = screen;
    state.lastArg = arg;
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const el = document.getElementById("screen-" + screen);
    if (el) el.classList.add("active");

    // 상단 nav active 표시
    document.querySelectorAll(".nav-link").forEach((n) => n.classList.remove("text-primary", "border-b-2", "border-primary"));

    if (screen === "main") {
      // 지도가 이미 그려져 있으면 마커만 갱신
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      renderScreen(screen, arg, el);
    }
    window.scrollTo(0, 0);
  }

  function renderScreen(screen, arg, el) {
    if (!el || !window.Screens) { if (el) el.innerHTML = placeholder(screen, arg); return; }
    if (screen === "country") {
      el.innerHTML = window.Screens.renderCountry(arg || defaultTarget());
    } else if (screen === "region") {
      el.innerHTML = window.Screens.renderRegion(arg || "EUROPE");
    } else if (screen === "region-report") {
      el.innerHTML = window.Screens.renderRegionReport(arg || "EUROPE");
      window.I18n.applyDom(el);
      window.Screens.switchRegionTab("summary");
      return;
    } else if (screen === "country-report") {
      const code = arg || defaultTarget();
      el.innerHTML = window.Screens.renderCountryReport(code);
      window.Screens._setReportCode(code);
      window.Screens.switchTab("summary");
    } else if (screen === "countries") {
      el.innerHTML = window.Screens.renderCountries();
      window.I18n.applyDom(el);
      window.Screens.renderCountryRows();
      return;
    } else if (screen === "settings") {
      el.innerHTML = window.Screens.renderSettings();
      window.I18n.applyDom(el);
      window.Screens.renderPreview();
      return;
    } else {
      el.innerHTML = placeholder(screen, arg);
    }
    window.I18n.applyDom(el);
  }

  function defaultTarget() {
    const c = window.Store.plannedCountries()[0];
    return c ? c.code : null;
  }

  function placeholder(screen, arg) {
    const titleMap = {
      region: "권역 상세 (M2)", country: "국가 상세 (M3)", countries: "국가 전체 보기 (M7)",
      "region-report": "권역 보고서 (M4)", "country-report": "국가 보고서 (M5)", settings: "가중치 설정 (M6)",
    };
    return `<main class="pt-20 min-h-screen flex items-center justify-center">
      <div class="text-center">
        <span class="material-symbols-outlined text-6xl text-outline-variant">construction</span>
        <h2 class="font-headline-md mt-4">${titleMap[screen] || screen}${arg ? " · " + arg : ""}</h2>
        <p class="text-secondary mt-2">다음 단계에서 구현됩니다.</p>
        <button class="mt-6 px-lg py-3 bg-primary text-white rounded-full font-body-bold" onclick="App.go('main')">${t("메인")}</button>
      </div></main>`;
  }

  // ===== 권역 선택 =====
  function toggleRegionDropdown() {
    const d = document.getElementById("region-dropdown");
    d.classList.toggle("hidden");
  }
  function selectRegion(id) {
    document.getElementById("region-dropdown").classList.add("hidden");
    const labelEl = document.getElementById("selected-region");
    if (id === "__all__") {
      labelEl.textContent = t("전체 보기");
      window.WorldMap.resetRegion();
      document.getElementById("region-close").classList.add("hidden");
      document.getElementById("region-close").classList.remove("flex");
      return;
    }
    const region = window.Geo.region(id);
    labelEl.textContent = window.I18n.lang === "en" ? region.name_en : region.name_ko;
    window.WorldMap.focusRegion(region);
    const closeBtn = document.getElementById("region-close");
    closeBtn.classList.remove("hidden");
    closeBtn.classList.add("flex");
    // P1 권역 요약 팝업
    window.Popups.showRegion(region);
  }
  function closeRegion() {
    window.WorldMap.resetRegion();
    document.getElementById("selected-region").textContent = t("전체 보기");
    const closeBtn = document.getElementById("region-close");
    closeBtn.classList.add("hidden");
    closeBtn.classList.remove("flex");
  }

  // ===== 언어 =====
  function syncLangButtons() {
    const ko = document.getElementById("lang-ko");
    const en = document.getElementById("lang-en");
    const isKo = window.I18n.lang === "ko";
    ko.classList.toggle("opacity-50", !isKo);
    ko.classList.toggle("bg-white", isKo);
    ko.classList.toggle("shadow", isKo);
    en.classList.toggle("opacity-50", isKo);
    en.classList.toggle("bg-white", !isKo);
    en.classList.toggle("shadow", !isKo);
  }
  function rerender() {
    renderRegionDropdown();
    renderMarkers();
    if (state.screen === "main") {
      const labelEl = document.getElementById("selected-region");
      if (!window.WorldMap.currentRegion) labelEl.textContent = t("전체 보기");
    } else {
      // 현재 화면을 새 언어로 다시 그린다
      const el = document.getElementById("screen-" + state.screen);
      if (el) renderScreen(state.screen, state.lastArg, el);
    }
  }

  // ===== P3 프로그레스 (4 에이전트 + 결과생성) =====
  function startProgress(scope) {
    // scope: {kind, code|regionId, name}
    state.activeScope = scope;
    showPanel(scope);
    openProgressModal();
  }

  function showPanel(scope) {
    const panel = document.getElementById("progress-panel");
    panel.classList.remove("hidden");
    document.getElementById("pp-scope").textContent = scope.kind === "region" ? "REGION" : "COUNTRY";
    document.getElementById("pp-name").textContent = scope.name;
    document.getElementById("pp-pct").textContent = "0%";
    document.getElementById("pp-bar").style.width = "0%";
    const rb = document.getElementById("pp-report");
    rb.disabled = true;
    rb.classList.add("bg-outline-variant", "opacity-50", "cursor-not-allowed");
    rb.classList.remove("bg-primary");
  }

  function openProgressModal() {
    if (!state.activeScope) {
      // 패널 없이 직접 열면 기본 대상(첫 진출예정국)으로
      const c = window.Store.plannedCountries()[0];
      state.activeScope = { kind: "country", code: c.code, name: c.name_ko };
      showPanel(state.activeScope);
    }
    renderProgressModal();
    runProgress();
  }

  function renderProgressModal() {
    const rows = AGENTS.map((a) => `
      <div class="space-y-sm">
        <div class="flex justify-between items-end">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-primary text-lg">${a.icon}</span>
            <span class="font-body-bold text-on-surface">${t(a.ko)}</span>
            <span class="text-xs text-on-surface-variant px-2 py-0.5 bg-surface-container-high rounded-full">${t(a.desc)}</span>
          </div>
          <span class="text-label-caps text-primary" id="pm-pct-${a.key}">0%</span>
        </div>
        <div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden border border-black/5">
          <div class="h-full bg-primary transition-all duration-300" id="pm-bar-${a.key}" style="width:0%"><div class="w-full h-full shimmer opacity-50"></div></div>
        </div>
      </div>`).join("");

    document.getElementById("modal-root").innerHTML = `
      <div class="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-md" onclick="if(event.target===this)App.closeProgressModal()">
        <div class="relative w-full max-w-3xl bg-white rounded-xl overflow-hidden shadow-2xl double-bezel pop-in">
          <div class="flex items-center justify-between px-xl py-lg bg-surface-container-lowest border-b border-outline-variant">
            <div class="flex flex-col">
              <span class="text-label-caps text-primary">${t("분석 상태")}</span>
              <h2 class="font-headline-md text-on-surface" data-i18n="시장 진입 분석 에이전트 가동 중">${t("시장 진입 분석 에이전트 가동 중")}</h2>
            </div>
            <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant" onclick="App.closeProgressModal()">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="p-xl space-y-lg">
            ${rows}
            <div class="pt-lg border-t border-outline-variant/50 space-y-sm">
              <div class="flex justify-between items-end">
                <div class="flex items-center gap-sm">
                  <span class="material-symbols-outlined text-secondary text-lg">auto_awesome</span>
                  <span class="font-body-bold text-secondary">${t("결과 생성")}</span>
                </div>
                <span class="text-label-caps text-secondary" id="pm-pct-result">0%</span>
              </div>
              <div class="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-black/5">
                <div class="h-full bg-tertiary-container transition-all duration-300" id="pm-bar-result" style="width:0%"><div class="w-full h-full shimmer opacity-50"></div></div>
              </div>
            </div>
          </div>
          <div class="px-xl py-lg bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between">
            <div class="flex items-center gap-sm text-on-surface-variant">
              <div class="w-2 h-2 rounded-full bg-tertiary glow-pulse"></div>
              <span class="text-xs" id="pm-status">${t("에이전트가 실시간 데이터를 처리하고 있습니다...")}</span>
            </div>
            <button class="px-xl py-3 rounded-full bg-outline-variant text-white font-body-bold flex items-center gap-md opacity-50 cursor-not-allowed transition-all" disabled id="pm-report">
              ${t("보고서보기")}
              <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">arrow_forward</span></div>
            </button>
          </div>
        </div>
      </div>`;
  }

  let progTimer = null;
  function runProgress() {
    if (progTimer) clearInterval(progTimer);
    const p = { market: 0, regulation: 0, product: 0, system: 0, result: 0 };
    state.progress = p;

    progTimer = setInterval(() => {
      let mainDone = true;
      AGENTS.forEach((a, i) => {
        const k = a.key;
        if (p[k] < 100) {
          p[k] = Math.min(100, p[k] + Math.random() * 4 + i * 0.3);
          mainDone = false;
        }
        setBar(k, p[k]);
      });
      // 결과 생성: 메인 4개가 충분히 진행되면 시작
      if (p.market > 75 && p.regulation > 65 && p.system > 50) {
        p.result = Math.min(100, p.result + Math.random() * 3);
        setBar("result", p.result);
        setStatus(t("최종 분석 보고서를 생성하는 중입니다..."));
      }
      // 패널 종합 진행률
      const overall = (p.market + p.regulation + p.product + p.system + p.result) / 5;
      updatePanel(overall);

      if (p.result >= 100) {
        clearInterval(progTimer);
        progTimer = null;
        completeProgress();
      }
    }, 120);
  }

  function setBar(key, val) {
    const bar = document.getElementById("pm-bar-" + key);
    const pct = document.getElementById("pm-pct-" + key);
    if (bar) bar.style.width = val + "%";
    if (pct) pct.textContent = Math.floor(val) + "%";
  }
  function setStatus(s) { const el = document.getElementById("pm-status"); if (el) el.textContent = s; }
  function updatePanel(overall) {
    const bar = document.getElementById("pp-bar");
    const pct = document.getElementById("pp-pct");
    if (bar) bar.style.width = overall + "%";
    if (pct) pct.textContent = Math.floor(overall) + "%";
  }

  function completeProgress() {
    setStatus(t("모든 분석이 완료되었습니다. 보고서를 확인하십시오."));
    const elStatus = document.getElementById("pm-status");
    if (elStatus) elStatus.classList.add("text-tertiary", "font-body-bold");
    // 모달 보고서 버튼 활성화
    enableReportBtn(document.getElementById("pm-report"));
    // 패널 보고서 버튼 활성화
    enableReportBtn(document.getElementById("pp-report"));
    [document.getElementById("pm-report"), document.getElementById("pp-report")].forEach((b) => {
      if (b) b.onclick = openReportFromPanel;
    });
  }
  function enableReportBtn(b) {
    if (!b) return;
    b.disabled = false;
    b.classList.remove("bg-outline-variant", "opacity-50", "cursor-not-allowed");
    b.classList.add("bg-primary", "hover:scale-105", "active:scale-95", "cursor-pointer", "shadow-lg");
  }

  function closeProgressModal() {
    if (progTimer) { /* 계속 진행 — 패널에서 추적 */ }
    document.getElementById("modal-root").innerHTML = "";
  }

  function openReportFromPanel() {
    const s = state.activeScope;
    if (!s) return;
    closeProgressModal();
    if (s.kind === "region") go("region-report", s.regionId);
    else go("country-report", s.code);
  }

  function openRulesetPopup() {
    // 현재 권역 확대 상태면 권역 대상, 아니면 첫 진출예정국 대상
    const region = window.WorldMap.currentRegion;
    if (region) window.Popups.showRuleset({ kind: "region", regionId: region.id, name: region.name_ko });
    else window.Popups.showRuleset(null);
  }

  // 전역 노출
  window.App = {
    init, go,
    toggleRegionDropdown, selectRegion, closeRegion,
    startProgress, openProgressModal, closeProgressModal, openReportFromPanel,
    openRulesetPopup,
  };

  // 외부 클릭 시 드롭다운 닫기
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#region-dropdown") && !e.target.closest('[onclick*="toggleRegionDropdown"]')) {
      const d = document.getElementById("region-dropdown");
      if (d) d.classList.add("hidden");
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
