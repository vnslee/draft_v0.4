/**
 * screens.js — 전체 화면(M3 국가상세 / M5 국가보고서) 렌더링
 * 실제 엔진 결과 + 국가 JSON 데이터를 바인딩한다.
 */
(function () {
  const t = (x) => (window.I18n ? window.I18n.t(x) : x);
  const isEn = () => window.I18n && window.I18n.lang === "en";
  const nameOf = (m) => (isEn() ? m.name : m.name_ko);

  const VERDICT_KO = { TRANSPLANTABLE: "이식·확장 가능", DEEP_RESEARCH: "심층조사 권고", BLOCKED: "진출 불가" };
  const VERDICT_EN = { TRANSPLANTABLE: "Highly Recommended", DEEP_RESEARCH: "Deep Research", BLOCKED: "Blocked" };
  const VERDICT_COLOR = { TRANSPLANTABLE: "#006242", DEEP_RESEARCH: "#b88324", BLOCKED: "#ba1a1a" };
  const TIER_LABEL = { TIER1: "공식 1차", TIER2: "준공식", TIER3: "참고", BLOCKED: "차단" };
  const CAT_COLOR = { MARKET: "#004ac6", REGULATORY: "#006242", FINANCIAL: "#b88324", SYSTEM: "#2563eb" };

  const fmt = (v) => (v == null ? "—" : Math.round(v * 10) / 10);

  // ===================== M3 국가 상세 =====================
  function renderCountry(code) {
    const meta = window.Store.countryMeta(code);
    if (!meta) return notFound("country");
    const data = window.Store.countries[code];
    const r = window.Store.analyze(code);
    const isBase = meta.role === "base";

    const catCards = r
      ? window.Store.CATEGORY_ORDER.map((c) => {
          const sc = r.categoryScores[c];
          return `
          <div class="flex flex-col gap-xs p-md border-r border-outline-variant/30 last:border-0">
            <span class="text-label-caps text-outline-variant">${t(window.Store.CATEGORY_KO[c])}</span>
            <div class="flex items-baseline gap-xs">
              <span class="font-display-lg text-[28px] font-bold" style="color:${CAT_COLOR[c]}">${fmt(sc)}</span>
              <span class="text-outline text-sm">/100</span>
            </div>
            <div class="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden mt-sm">
              <div class="h-full shimmer-bar" style="width:${Math.max(0, Math.min(100, sc || 0))}%;background:${CAT_COLOR[c]}"></div>
            </div>
          </div>`;
        }).join("")
      : `<div class="p-md text-outline">${t("비교국")} 기준(진출국) — 유사도 분석 대상 아님</div>`;

    const sysItems = window.Store.itemsByCategory(code);
    const sysRows = sysItems
      ? sysItems.SYSTEM.slice(0, 6)
          .map((i) => `
            <div class="flex justify-between items-center py-sm border-b border-outline-variant/30">
              <span class="text-on-surface-variant font-body-base text-sm">${i.name}</span>
              <span class="font-body-bold text-sm">${i.sim == null ? "—" : fmt(i.sim) + "%"}</span>
            </div>`).join("")
      : "";

    const verdictBadge = r
      ? `<span class="font-label-caps px-md py-xs rounded-full" style="background:${VERDICT_COLOR[r.verdict]}1a;color:${VERDICT_COLOR[r.verdict]}">${isEn() ? VERDICT_EN[r.verdict] : t(VERDICT_KO[r.verdict])}</span>`
      : "";

    const aiSummary = data.exec_summary || "분석 요약 데이터가 없습니다.";

    // 세부 통계 테이블 (시장+규제 상위 항목)
    const tableRows = sysItems
      ? [...sysItems.MARKET.slice(0, 3), ...sysItems.REGULATORY.slice(0, 3)]
          .map((i) => {
            const stColor = i.sim == null ? "#737686" : i.sim >= 70 ? "#006242" : i.sim >= 40 ? "#b88324" : "#ba1a1a";
            const stLabel = i.sim == null ? "데이터없음" : i.sim >= 70 ? "유사" : i.sim >= 40 ? "보통" : "상이";
            return `<tr>
              <td class="py-md text-sm">${t(window.Store.CATEGORY_KO[i.category])}</td>
              <td class="py-md font-body-bold text-sm">${i.name}</td>
              <td class="py-md text-sm">${i.value_raw ? String(i.value_raw).slice(0, 40) : "—"}</td>
              <td class="py-md text-sm">${i.sim == null ? "—" : fmt(i.sim) + "%"}</td>
              <td class="py-md"><span class="px-sm py-xs rounded-full text-xs font-bold" style="background:${stColor}1a;color:${stColor}">${stLabel}</span></td>
            </tr>`;
          }).join("")
      : "";

    return `
    <main class="pt-20 min-h-screen">
      <section class="px-margin-desktop py-xl bg-surface-container-low">
        <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-md">
          <div class="flex items-center gap-lg">
            <div class="w-16 h-12 bg-white rounded-lg shadow-sm border border-outline-variant flex items-center justify-center text-3xl">${meta.flag || "🏳️"}</div>
            <div class="flex flex-col">
              <div class="flex items-baseline gap-sm">
                <h1 class="font-headline-md text-headline-md text-on-surface">${nameOf(meta)}</h1>
                <span class="font-label-caps text-label-caps text-outline">${meta.name}</span>
                ${verdictBadge}
              </div>
              <p class="font-body-base text-on-surface-variant">${t(window.Store.CATEGORY_KO[meta.region] || "")}${isBase ? " · 기준(진출국)" : " · " + t("비교국") + ": " + (window.Store.base ? window.Store.base.country_name : "—")}</p>
            </div>
          </div>
          ${isBase ? "" : `<button class="group flex items-center gap-md bg-primary text-on-primary px-lg py-md rounded-full font-body-bold shadow-md hover:bg-primary-container transition-all active:scale-95" onclick="App.startProgress({kind:'country',code:'${code}',name:'${meta.name_ko}'})">
            시뮬레이션 실행
            <div class="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center"><span class="material-symbols-outlined text-on-primary text-[18px]">play_arrow</span></div>
          </button>`}
        </div>
      </section>

      <section class="px-margin-desktop py-lg grid grid-cols-12 gap-gutter">
        <div class="col-span-12 md:col-span-8 bezel-card">
          <div class="bezel-inner h-full p-lg flex flex-col gap-lg">
            <div class="flex justify-between items-center">
              <h3 class="font-headline-md text-headline-md">국가 종합 진단 지표</h3>
              <span class="font-label-caps text-primary bg-primary-fixed px-sm py-1 rounded">SURVEY: ${data.survey_date || "—"}</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-0 flex-grow">${catCards}</div>
            ${r ? `<div class="flex items-end justify-between p-md bg-surface rounded-xl">
              <div><span class="text-label-caps text-outline">${t("종합 유사도")}</span>
                <div class="flex items-baseline gap-2"><span class="font-stat-lg text-stat-lg" style="color:${VERDICT_COLOR[r.verdict]}">${fmt(r.total)}</span><span class="text-outline">/100</span></div></div>
              <div class="text-right text-sm text-on-surface-variant">${t("시스템 게이트")}: <b style="color:${r.gatePassed ? '#006242' : '#ba1a1a'}">${r.gatePassed ? t("통과") : t("미달")}</b><br/>${t("유효신뢰도")}: <b>${r.effConf}</b></div>
            </div>` : ""}
          </div>
        </div>

        <div class="col-span-12 md:col-span-4 bezel-card">
          <div class="bezel-inner h-full p-lg flex flex-col gap-md">
            <h3 class="font-body-bold">주요 시스템 정보 (유사도)</h3>
            <div class="flex flex-col gap-sm">${sysRows || '<span class="text-outline text-sm">데이터 없음</span>'}</div>
            <div class="mt-auto p-md bg-secondary-container rounded-xl">
              <p class="text-on-secondary-container text-sm leading-relaxed"><span class="font-bold">AI 분석 요약:</span> ${aiSummary}</p>
            </div>
          </div>
        </div>

        <div class="col-span-12 bezel-card">
          <div class="bezel-inner p-lg">
            <div class="flex justify-between items-center mb-lg">
              <h3 class="font-headline-md text-headline-md">세부 통계 지표</h3>
              ${r ? `<button class="flex items-center gap-xs px-md py-sm bg-primary text-white rounded-lg font-body-bold text-sm" onclick="App.go('country-report','${code}')"><span class="material-symbols-outlined text-sm">description</span>보고서 보기</button>` : ""}
            </div>
            <div class="overflow-x-auto"><table class="w-full text-left">
              <thead><tr class="border-b border-outline">
                <th class="py-md font-label-caps text-outline">카테고리</th><th class="py-md font-label-caps text-outline">지표명</th>
                <th class="py-md font-label-caps text-outline">현재값</th><th class="py-md font-label-caps text-outline">유사도</th><th class="py-md font-label-caps text-outline">상태</th>
              </tr></thead>
              <tbody class="divide-y divide-outline-variant/30">${tableRows || '<tr><td class="py-md text-outline" colspan="5">데이터 없음</td></tr>'}</tbody>
            </table></div>
          </div>
        </div>
      </section>
    </main>`;
  }

  // ===================== M5 국가 보고서 =====================
  const REPORT_TABS = [
    { key: "summary", ko: "요약" }, { key: "verdict", ko: "판정근거" }, { key: "cost", ko: "비용 추정" },
    { key: "risk", ko: "리스크" }, { key: "weight", ko: "가중치" }, { key: "source", ko: "출처" },
  ];

  function renderCountryReport(code) {
    const meta = window.Store.countryMeta(code);
    if (!meta) return notFound("country-report");
    const r = window.Store.analyze(code);
    if (!r) return `<main class="pt-24 min-h-screen flex items-center justify-center"><p class="text-outline">${nameOf(meta)}는 기준(진출국)이라 진단 보고서가 없습니다.</p></main>`;

    const reportId = `MED-${(window.Store.base.survey_date || "2025").replace("-", "")}-${code}`;
    const vColor = VERDICT_COLOR[r.verdict];

    const tabBtns = REPORT_TABS.map((tab, i) => `
      <button class="report-tab px-lg py-md whitespace-nowrap ${i === 0 ? "tab-active" : "font-body-base text-on-surface-variant"}" data-tab="${tab.key}" onclick="Screens.switchTab('${tab.key}')">${t(tab.ko)}</button>`).join("");

    return `
    <main class="pt-24 pb-xxl px-margin-desktop">
      <div class="flex flex-col md:flex-row justify-between items-end gap-md mb-xl">
        <div class="flex flex-col gap-sm">
          <div class="flex items-center gap-md">
            <div class="w-12 h-8 bezel-card overflow-hidden flex items-center justify-center text-2xl bg-white">${meta.flag || "🏳️"}</div>
            <div><h1 class="font-headline-md text-headline-md">${nameOf(meta)} (${code})</h1>
              <p class="font-body-base text-on-surface-variant">${meta.name} · ${t(window.Store.CATEGORY_KO[meta.region] || meta.region)}</p></div>
          </div>
          <div class="flex items-center gap-sm mt-xs">
            <span class="font-label-caps bg-surface-container-highest px-md py-xs rounded-full">Region: ${meta.region}</span>
            <span class="text-outline-variant">/</span>
            <span class="font-label-caps bg-surface-container-highest px-md py-xs rounded-full">${t("비교국")}: ${window.Store.base.country_name}</span>
          </div>
        </div>
        <div class="flex flex-col items-end gap-sm text-right">
          <div class="text-on-surface-variant space-y-1">
            <p class="font-label-caps">Report ID: <span class="font-bold">#${reportId}</span></p>
            <p class="font-label-caps">Created: ${todayStr()}</p>
            <p class="font-label-caps">Snapshot: ${window.Store.base.survey_date} (base) / ${window.Store.countries[code].survey_date} (target)</p>
          </div>
          <button class="flex items-center gap-sm bg-primary text-on-primary px-xl py-md rounded-full font-body-bold shadow-md hover:bg-primary-container transition-all" onclick="window.print()">
            <span class="material-symbols-outlined">download</span>보고서 PDF 다운로드
          </button>
        </div>
      </div>

      <div class="flex border-b border-outline-variant mb-lg overflow-x-auto">${tabBtns}</div>
      <div id="report-tab-body"></div>
    </main>`;
  }

  // 탭 본문 렌더 (전환 시 호출)
  function switchTab(key) {
    document.querySelectorAll(".report-tab").forEach((b) => {
      const active = b.dataset.tab === key;
      b.classList.toggle("tab-active", active);
      b.classList.toggle("font-body-base", !active);
      b.classList.toggle("text-on-surface-variant", !active);
    });
    const code = state.reportCode;
    const body = document.getElementById("report-tab-body");
    if (body) { body.innerHTML = tabContent(key, code); window.I18n.translateTree(body); }
  }

  function tabContent(key, code) {
    const r = window.Store.analyze(code);
    const data = window.Store.countries[code];
    const meta = window.Store.countryMeta(code);
    const vColor = VERDICT_COLOR[r.verdict];

    if (key === "summary") {
      const catBars = window.Store.CATEGORY_ORDER.map((c) => barRow(t(window.Store.CATEGORY_KO[c]), r.categoryScores[c], CAT_COLOR[c])).join("");
      const insights = (data.insights || []).map((i) => `
        <div class="p-md border-l-4 border-primary bg-surface rounded-r-lg">
          <p class="font-body-bold text-on-surface">${i.title}</p>
          <p class="text-sm text-on-surface-variant mt-1 leading-relaxed">${i.body}</p>
        </div>`).join("");
      return `
        <div class="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <div class="md:col-span-8 bezel-card"><div class="bezel-inner p-xl flex flex-col h-full">
            <div class="flex justify-between items-start mb-lg">
              <div><h3 class="font-headline-md text-headline-md">종합 진단 결과</h3><p class="text-on-surface-variant">시장 진입 타당성 및 매력도 스코어</p></div>
              <div class="flex flex-col items-end"><span class="font-stat-lg text-stat-lg" style="color:${vColor}">${fmt(r.total)} <span class="text-headline-md text-outline">/ 100</span></span>
                <span class="font-label-caps px-sm py-xs rounded-full mt-1" style="background:${vColor}1a;color:${vColor}">${isEn() ? VERDICT_EN[r.verdict] : t(VERDICT_KO[r.verdict])}</span></div>
            </div>
            <div class="space-y-lg flex-grow">${catBars}</div>
          </div></div>
          <div class="md:col-span-4 bezel-card"><div class="bezel-inner p-xl h-full" style="background:#2563eb;color:#eeefff">
            <div class="flex items-center gap-sm mb-md"><span class="material-symbols-outlined">insights</span><h4 class="font-body-bold">AI 진단 제언</h4></div>
            <p class="font-body-base leading-relaxed">${data.exec_summary || "—"}</p>
          </div></div>
          <div class="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-gutter">${insights}</div>
        </div>`;
    }

    if (key === "verdict") {
      const groups = window.Store.itemsByCategory(code);
      const sections = window.Store.CATEGORY_ORDER.map((c) => {
        const rows = groups[c].map((i) => `
          <tr>
            <td class="py-sm text-sm ${i.is_killswitch ? "font-bold text-error" : ""}">${i.name}${i.is_killswitch ? " 🔒" : ""}</td>
            <td class="py-sm text-sm text-right">${i.sim == null ? '<span class="text-outline">' + (i.reason || "—") + "</span>" : fmt(i.sim)}</td>
            <td class="py-sm text-sm text-right text-outline">${i.conf == null ? "—" : i.conf}</td>
            <td class="py-sm text-sm text-right text-outline">${i.reason || ""}</td>
          </tr>`).join("");
        return `
          <div class="bezel-card"><div class="bezel-inner p-lg">
            <div class="flex justify-between items-center mb-md">
              <h4 class="font-body-bold" style="color:${CAT_COLOR[c]}">${t(window.Store.CATEGORY_KO[c])}</h4>
              <span class="font-stat-lg text-xl font-bold" style="color:${CAT_COLOR[c]}">${fmt(r.categoryScores[c])}</span>
            </div>
            <table class="w-full"><thead><tr class="border-b border-outline-variant text-outline text-label-caps">
              <th class="text-left py-xs">항목</th><th class="text-right py-xs">유사도</th><th class="text-right py-xs">신뢰</th><th class="text-right py-xs">방식</th>
            </tr></thead><tbody class="divide-y divide-outline-variant/20">${rows}</tbody></table>
          </div></div>`;
      }).join("");
      const ks = r.killswitchHits.length
        ? `<div class="bezel-card mb-gutter"><div class="bezel-inner p-lg bg-error-container"><p class="font-body-bold text-error">⚠ 킬스위치 작동: ${r.killswitchHits.join(", ")}</p></div></div>`
        : `<div class="p-md bg-tertiary-container/10 rounded-lg mb-gutter text-sm"><b class="text-tertiary">${t("킬스위치")}: ${t("전부 통과")}</b> · ${t("시스템 게이트")} <b style="color:${r.gatePassed ? '#006242' : '#ba1a1a'}">${r.gatePassed ? t("통과") : t("미달")}</b> (${fmt(r.categoryScores.SYSTEM)})</div>`;
      return ks + `<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">${sections}</div>`;
    }

    if (key === "cost") {
      const rows = window.Store.costTable().map((c) => {
        const active = costRangeActive(r.total, c.range);
        return `<tr class="${active ? "bg-primary-fixed/40" : ""}">
          <td class="py-md font-body-bold ${active ? "text-primary" : ""}">${c.range}${active ? " ◀" : ""}</td>
          <td class="py-md">${c.ratio}</td><td class="py-md text-on-surface-variant">${c.meaning}</td></tr>`;
      }).join("");
      const costMsg = r.costRatio != null
        ? `<div class="flex items-baseline gap-2"><span class="font-stat-lg text-stat-lg text-primary">${Math.round(r.costRatio * 100)}%</span><span class="text-on-surface-variant">${t("비교국 대비")} (${t("추정 비용")})</span></div>`
        : `<p class="text-on-surface-variant">시스템 게이트 미달 또는 임계 미달로 <b>비용 추정 보류</b> — 심층조사 전환 권고</p>`;
      return `
        <div class="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <div class="md:col-span-5 bezel-card"><div class="bezel-inner p-xl h-full flex flex-col justify-center gap-md">
            <h3 class="font-headline-md text-headline-md">${t("추정 비용")}</h3>${costMsg}
            <p class="text-sm text-outline leading-relaxed">유사도→비용은 비선형. 진출국 실적이 누적되면 함수로 고도화(설계서 6.4·8장).</p>
          </div></div>
          <div class="md:col-span-7 bezel-card"><div class="bezel-inner p-lg">
            <h4 class="font-body-bold mb-md">유사도 구간별 비용 변환표</h4>
            <table class="w-full text-left"><thead><tr class="border-b border-outline text-label-caps text-outline">
              <th class="py-sm">종합 유사도</th><th class="py-sm">비용 비율</th><th class="py-sm">의미</th></tr></thead>
              <tbody class="divide-y divide-outline-variant/30">${rows}</tbody></table>
          </div></div>
        </div>`;
    }

    if (key === "risk") {
      const sevColor = { hi: "#ba1a1a", md: "#b88324", lo: "#575d78" };
      const sevLabel = { hi: "높음", md: "보통", lo: "낮음" };
      const risks = (data.risks || []).map((rk) => `
        <li class="flex items-start gap-md p-md bezel-card"><div class="bezel-inner p-md flex items-start gap-md w-full">
          <span class="material-symbols-outlined" style="color:${sevColor[rk.sev] || '#575d78'}">${rk.sev === "hi" ? "warning" : rk.sev === "md" ? "change_circle" : "info"}</span>
          <div><div class="flex items-center gap-2"><p class="font-body-bold text-on-surface">${rk.title}</p>
            <span class="text-xs px-2 py-0.5 rounded-full" style="background:${(sevColor[rk.sev]||'#575d78')}1a;color:${sevColor[rk.sev]||'#575d78'}">${sevLabel[rk.sev] || rk.sev}</span></div>
            <p class="text-sm text-on-surface-variant mt-1">${rk.body}</p></div>
        </div></li>`).join("");
      const recs = (data.recommendations || []).map((rc) => `
        <div class="p-md border-l-4 border-primary bg-surface rounded-r-lg">
          <p class="font-label-caps text-primary">STEP ${rc.step}</p><p class="font-body-bold">${rc.title}</p>
          <p class="text-sm text-on-surface-variant mt-1">${rc.body}</p></div>`).join("");
      return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div><h3 class="font-headline-md text-headline-md mb-md">핵심 리스크 요인</h3><ul class="space-y-md">${risks || '<p class="text-outline">데이터 없음</p>'}</ul></div>
          <div><h3 class="font-headline-md text-headline-md mb-md">진입 전략 제언</h3><div class="space-y-md">${recs || '<p class="text-outline">데이터 없음</p>'}</div></div>
        </div>`;
    }

    if (key === "weight") {
      const w = window.SimilarityEngine.RULESET;
      const wRows = window.Store.CATEGORY_ORDER.map((c) => barRow(t(window.Store.CATEGORY_KO[c]), w.categoryWeights[c] * 100, CAT_COLOR[c], "%")).join("");
      return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div class="bezel-card"><div class="bezel-inner p-xl">
            <h4 class="font-body-bold mb-lg">카테고리 가중치 (스냅샷: ${w.name})</h4>
            <div class="space-y-lg">${wRows}</div>
          </div></div>
          <div class="bezel-card"><div class="bezel-inner p-xl">
            <h4 class="font-body-bold mb-lg">임계값 / 신뢰도 계수</h4>
            <div class="space-y-sm">
              ${kv("이식 임계", w.thresholds.entry + "점")}
              ${kv("시스템 게이트 하한", w.thresholds.systemGate + "점")}
              ${kv("저신뢰 기준", w.thresholds.lowConfidence)}
              ${kv("공식(Tier1) 계수", "1.0")}
              ${kv("준공식(Tier2) 계수", "0.8")}
              ${kv("참고(Tier3) 계수", "0.5")}
            </div>
            <p class="text-xs text-outline mt-md">설정(M6)에서 변경 시 새 룰셋 버전으로 저장되어 과거 보고서는 그대로 재현됩니다.</p>
          </div></div>
        </div>`;
    }

    if (key === "source") {
      const groups = window.Store.itemsByCategory(code);
      const all = [].concat(...window.Store.CATEGORY_ORDER.map((c) => groups[c]));
      const rows = all
        .filter((i) => i.source_detail)
        .map((i) => {
          const tierColor = i.source_tier === "TIER1" ? "#006242" : i.source_tier === "TIER2" ? "#004ac6" : i.source_tier === "TIER3" ? "#b88324" : "#ba1a1a";
          return `<tr>
            <td class="py-sm text-sm">${i.name}</td>
            <td class="py-sm"><span class="px-2 py-0.5 rounded-full text-xs font-bold" style="background:${tierColor}1a;color:${tierColor}">${TIER_LABEL[i.source_tier] || i.source_tier || "—"}</span>${i.official_gap_flag ? ` <span class="text-xs text-error">·${t("공식 출처 미확보")}</span>` : ""}</td>
            <td class="py-sm text-sm text-on-surface-variant">${i.source_detail}</td>
          </tr>`;
        }).join("");
      return `<div class="bezel-card"><div class="bezel-inner p-lg">
        <div class="flex justify-between items-center mb-md">
          <h4 class="font-body-bold">출처 목록 (Tier1 공식 우선 인용)</h4>
          <span class="text-sm text-outline">${all.filter((i) => i.source_detail).length}개 항목</span>
        </div>
        <div class="overflow-x-auto"><table class="w-full text-left">
          <thead><tr class="border-b border-outline text-label-caps text-outline"><th class="py-sm">항목</th><th class="py-sm">등급</th><th class="py-sm">출처</th></tr></thead>
          <tbody class="divide-y divide-outline-variant/30">${rows}</tbody></table></div>
      </div></div>`;
    }
    return "";
  }

  // ===== 헬퍼 =====
  const state = { reportCode: null };
  function barRow(label, val, color, suffix) {
    const v = val == null ? 0 : Math.max(0, Math.min(100, val));
    return `<div><div class="flex justify-between items-center mb-sm"><span class="font-body-base">${label}</span><span class="font-body-bold" style="color:${color}">${fmt(val)}${suffix || ""}</span></div>
      <div class="h-1.5 w-full bg-surface-container rounded-full overflow-hidden"><div class="h-full relative" style="width:${v}%;background:${color}"><div class="absolute inset-0 shimmer"></div></div></div></div>`;
  }
  function kv(k, v) { return `<div class="flex justify-between items-center py-sm border-b border-outline-variant/30"><span class="text-on-surface-variant text-sm">${k}</span><span class="font-body-bold text-sm">${v}</span></div>`; }
  function costRangeActive(total, range) {
    if (range === "90% 이상") return total >= 90;
    if (range === "80~90%") return total >= 80 && total < 90;
    if (range === "70~80%") return total >= 70 && total < 80;
    return total < 70;
  }
  function todayStr() { return (window.APP_TODAY || "2026-06-18").replace(/-/g, ". "); }
  function notFound(s) { return `<main class="pt-24 min-h-screen flex items-center justify-center"><p class="text-outline">대상을 찾을 수 없습니다.</p></main>`; }

  // ===================== M2 권역 상세 =====================
  function renderRegion(regionId) {
    const region = window.Geo.region(regionId || "EUROPE");
    if (!region) return notFound("region");
    const { rows, entered } = window.Store.regionRanking(region.id);
    const regName = isEn() ? region.name_en : region.name_ko;

    // 권역 경쟁력 요약 = 진출예정국 카테고리 평균
    const avg = {};
    window.Store.CATEGORY_ORDER.forEach((c) => {
      const vals = rows.map((x) => x.result.categoryScores[c]).filter((v) => v != null);
      avg[c] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    });
    const summaryBars = window.Store.CATEGORY_ORDER.map((c) => `
      <div><div class="flex justify-between items-end mb-xs">
        <span class="font-body-base text-on-surface-variant">${t(window.Store.CATEGORY_KO[c])}</span>
        <span class="font-display-lg text-[24px] font-bold text-on-surface">${fmt(avg[c])}<small class="text-sm font-normal ml-xs">pts</small></span></div>
        <div class="h-1.5 bg-surface-container rounded-full overflow-hidden"><div class="h-full relative" style="width:${Math.max(0,Math.min(100,avg[c]||0))}%;background:${CAT_COLOR[c]}"><div class="absolute inset-0 shimmer"></div></div></div></div>`).join("");

    const rankRows = rows.length
      ? rows.map((x) => {
          const r = x.result, vColor = VERDICT_COLOR[r.verdict];
          const cats = window.Store.CATEGORY_ORDER.map((c) => `<td class="py-lg px-md text-sm" style="color:${CAT_COLOR[c]}">${fmt(r.categoryScores[c])}</td>`).join("");
          return `<tr class="hover:bg-surface-container-low transition-colors cursor-pointer" onclick="App.go('country','${x.meta.code}')">
            <td class="py-lg px-md"><div class="flex items-center gap-md"><span class="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm">${x.rank}</span>
              <span class="text-xl">${x.meta.flag || ""}</span><span class="font-body-bold">${nameOf(x.meta)}</span></div></td>
            ${cats}
            <td class="py-lg px-md"><div class="flex items-center gap-md"><span class="font-display-lg text-[20px]" style="color:${vColor}">${fmt(r.total)}</span>
              <div class="w-20 h-1.5 bg-outline-variant rounded-full overflow-hidden"><div class="h-full" style="width:${Math.max(0,Math.min(100,r.total))}%;background:${vColor}"></div></div></div></td>
            <td class="py-lg px-md"><span class="px-sm py-1 rounded-full text-xs font-bold" style="background:${vColor}1a;color:${vColor}">${isEn() ? VERDICT_EN[r.verdict] : t(VERDICT_KO[r.verdict])}</span></td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="7" class="py-lg px-md text-outline text-center">이 권역에 진출 예정국 데이터가 없습니다.</td></tr>`;

    const enteredChips = entered.map((c) => `<span class="px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-sm">${nameOf(c)}</span>`).join("") || `<span class="text-sm text-outline">없음</span>`;

    return `
    <main class="pt-24 pb-xxl px-margin-desktop">
      <section class="flex flex-col md:flex-row md:items-end justify-between mb-xl gap-md">
        <div>
          <nav class="flex items-center gap-xs text-outline text-label-caps mb-sm"><span>GLOBAL MARKET</span>
            <span class="material-symbols-outlined text-[12px]">chevron_right</span><span>${region.name_en.toUpperCase()}</span></nav>
          <h1 class="font-display-lg text-display-lg text-on-surface">${regName} 권역 상세정보</h1>
          <p class="text-on-surface-variant mt-xs max-w-2xl">권역 내 진출 예정국을 종합 유사도 기준으로 정렬하고 카테고리별 점수를 분해해 진출 우선순위를 제시합니다.</p>
        </div>
        <div class="flex items-center gap-md">
          <button class="h-12 px-lg bg-surface-container-high border border-outline-variant rounded-full flex items-center gap-md hover:bg-surface-variant" onclick="App.go('region-report','${region.id}')">
            <span class="font-body-bold">보고서</span><div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white"><span class="material-symbols-outlined text-[18px]">download</span></div></button>
          <button class="h-12 px-lg bg-primary rounded-full flex items-center gap-md hover:bg-primary-container shadow-lg" onclick="App.startProgress({kind:'region',regionId:'${region.id}',name:'${region.name_ko}'})">
            <span class="font-body-bold text-white">시뮬레이션</span><div class="w-8 h-8 rounded-full bg-on-primary-fixed flex items-center justify-center text-white"><span class="material-symbols-outlined text-[18px]">play_arrow</span></div></button>
        </div>
      </section>

      <div class="grid grid-cols-12 gap-gutter">
        <div class="col-span-12 lg:col-span-8 bezel-card"><div class="bezel-inner p-lg h-full flex flex-col">
          <div class="flex justify-between items-start mb-lg">
            <div><h3 class="font-headline-md text-headline-md">진출 완료 국가</h3><p class="text-on-surface-variant">이 권역의 기준(진출) 국가</p></div>
          </div>
          <div class="flex flex-wrap gap-xs mb-lg">${enteredChips}</div>
          <div class="mt-auto p-md bg-primary-container rounded-xl text-on-primary-container" style="background:#2563eb;color:#eeefff">
            <div class="flex gap-md"><span class="material-symbols-outlined">lightbulb</span>
              <div><p class="font-body-bold">진단 어드바이스</p><p class="text-sm opacity-90 mt-xs">${rows[0] ? rows[0].meta.name_ko + "이(가) Quick-Win #1 입니다. 종합 " + fmt(rows[0].total) + "점." : "진출 예정국 데이터를 추가하세요."}</p></div></div>
          </div>
        </div></div>

        <div class="col-span-12 lg:col-span-4 bezel-card"><div class="bezel-inner p-lg h-full">
          <h3 class="font-headline-md text-headline-md mb-lg">권역 경쟁력 요약</h3>
          <div class="space-y-lg">${summaryBars}</div>
        </div></div>

        <div class="col-span-12 bezel-card"><div class="bezel-inner p-lg">
          <h3 class="font-headline-md text-headline-md mb-lg">국가별 순위 — 카테고리 분해</h3>
          <div class="overflow-x-auto"><table class="w-full text-left border-collapse">
            <thead><tr class="border-b border-outline-variant text-label-caps text-outline">
              <th class="py-md px-md">순위 / 국가</th>
              ${window.Store.CATEGORY_ORDER.map((c) => `<th class="py-md px-md">${t(window.Store.CATEGORY_KO[c])}</th>`).join("")}
              <th class="py-md px-md">종합 점수</th><th class="py-md px-md">판정</th>
            </tr></thead>
            <tbody class="divide-y divide-outline-variant/30">${rankRows}</tbody>
          </table></div>
        </div></div>
      </div>
    </main>`;
  }

  // ===================== M4 권역 보고서 =====================
  const REGION_TABS = [
    { key: "summary", ko: "요약" }, { key: "MARKET", ko: "시장" }, { key: "REGULATORY", ko: "규제" },
    { key: "FINANCIAL", ko: "상품" }, { key: "SYSTEM", ko: "시스템" },
  ];

  function renderRegionReport(regionId) {
    const region = window.Geo.region(regionId || "EUROPE");
    if (!region) return notFound("region-report");
    rstate.region = region.id;
    const regName = isEn() ? region.name_en : region.name_ko;
    const reportId = `${region.name_en.slice(0, 2).toUpperCase()}-${(window.APP_TODAY || "2026").slice(0, 4)}-RGN`;

    const tabBtns = REGION_TABS.map((tab, i) => `
      <button class="rgn-tab px-xl py-md whitespace-nowrap ${i === 0 ? "tab-active" : "text-on-surface-variant"}" data-tab="${tab.key}" onclick="Screens.switchRegionTab('${tab.key}')">${t(tab.ko)}</button>`).join("");

    return `
    <main class="pt-24 pb-xxl px-margin-desktop">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-xl gap-md">
        <div class="flex items-center gap-md">
          <div class="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center text-on-primary" style="background:#2563eb">
            <span class="material-symbols-outlined text-4xl" style="font-variation-settings:'FILL' 1">public</span></div>
          <div><h1 class="font-headline-md text-headline-md">${regName}(${region.name_en}) 권역 Quick-Win 분석 보고서</h1>
            <p class="text-on-surface-variant">Regional expansion diagnostic report</p></div>
        </div>
        <div class="text-right flex flex-col items-end gap-xs">
          <div class="flex gap-sm text-label-caps text-outline"><span>REPORT ID: #${reportId}</span><span>•</span><span>CREATED: ${todayStr()}</span></div>
          <button class="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-full font-body-bold hover:scale-105 transition-transform" onclick="window.print()">
            <span class="material-symbols-outlined">download</span>보고서 PDF 다운로드</button>
        </div>
      </div>
      <div class="flex border-b border-outline-variant mb-lg overflow-x-auto">${tabBtns}</div>
      <div id="rgn-tab-body"></div>
    </main>`;
  }

  function switchRegionTab(key) {
    document.querySelectorAll(".rgn-tab").forEach((b) => {
      const active = b.dataset.tab === key;
      b.classList.toggle("tab-active", active);
      b.classList.toggle("text-on-surface-variant", !active);
    });
    const body = document.getElementById("rgn-tab-body");
    if (body) { body.innerHTML = regionTabContent(key, rstate.region); window.I18n.translateTree(body); }
  }

  function regionTabContent(key, regionId) {
    const { rows } = window.Store.regionRanking(regionId);
    const region = window.Geo.region(regionId);

    if (key === "summary") {
      const top = rows[0];
      const overall = rows.length ? rows.reduce((a, b) => a + b.total, 0) / rows.length : null;
      const rankList = rows.map((x) => `
        <li class="flex items-center justify-between p-md bg-surface-container-low rounded-lg">
          <div class="flex items-center gap-md"><span class="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">${x.rank}</span>
            <span>${x.meta.flag || ""}</span><span class="font-body-bold">${nameOf(x.meta)}</span></div>
          <span class="font-display-lg text-[18px]" style="color:${VERDICT_COLOR[x.result.verdict]}">${fmt(x.total)}</span></li>`).join("");
      return `
        <div class="grid grid-cols-12 gap-gutter">
          <div class="col-span-12 md:col-span-4 bezel-card"><div class="bezel-inner p-lg rounded-xl flex flex-col justify-between h-full">
            <div><span class="text-label-caps text-outline">권역 평균 유사도</span>
              <h2 class="font-display-lg text-display-lg text-primary mt-xs">${fmt(overall)}<span class="text-headline-md text-outline">/100</span></h2></div>
            <p class="mt-md text-on-surface-variant">${region.name_ko} 권역 진출 예정국 ${rows.length}개국의 종합 유사도 평균입니다. 1위는 ${top ? nameOf(top.meta) : "—"}.</p>
          </div></div>
          <div class="col-span-12 md:col-span-8 bezel-card"><div class="bezel-inner p-lg rounded-xl">
            <h3 class="font-headline-md text-headline-md mb-md">진출 우선순위</h3>
            <ul class="space-y-sm">${rankList || '<li class="text-outline">데이터 없음</li>'}</ul>
          </div></div>
        </div>`;
    }

    // 카테고리 탭: 권역 내 국가별 해당 카테고리 점수 + 항목 비교
    const catKo = window.Store.CATEGORY_KO[key];
    const cards = rows.map((x) => {
      const sc = x.result.categoryScores[key];
      const items = window.Store.itemsByCategory(x.meta.code)[key] || [];
      const top3 = items.filter((i) => i.sim != null).slice(0, 4)
        .map((i) => `<div class="flex justify-between text-sm py-0.5"><span class="text-on-surface-variant">${i.name}</span><span class="font-body-bold" style="color:${CAT_COLOR[key]}">${fmt(i.sim)}</span></div>`).join("");
      return `<div class="bezel-card"><div class="bezel-inner p-lg">
        <div class="flex justify-between items-center mb-md"><div class="flex items-center gap-sm"><span>${x.meta.flag || ""}</span><h4 class="font-body-bold">${nameOf(x.meta)}</h4></div>
          <span class="font-stat-lg text-xl font-bold" style="color:${CAT_COLOR[key]}">${fmt(sc)}</span></div>
        <div class="border-t border-outline-variant/30 pt-sm">${top3 || '<span class="text-outline text-sm">항목 없음</span>'}</div>
      </div></div>`;
    }).join("");
    return `<h3 class="font-headline-md text-headline-md mb-lg" style="color:${CAT_COLOR[key]}">${t(catKo)} 카테고리 — 국가별 비교</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">${cards || '<p class="text-outline">데이터 없음</p>'}</div>`;
  }

  const rstate = { region: "EUROPE" };

  // ===================== M7 국가 리스트 =====================
  function renderCountries() {
    listState.filter = new Set(window.Store.index.countries.map((c) => c.code));
    return `
    <main class="pt-32 pb-xl px-margin-desktop min-h-screen">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-end mb-xl gap-md">
          <div>
            <h1 class="font-display-lg text-display-lg text-on-surface mb-xs">국가 리스트</h1>
            <p class="text-on-surface-variant">전체 국가의 진단 스코어·판정·진출 현황을 한눈에 확인합니다.</p>
          </div>
          <div class="relative">
            <button class="h-[52px] px-lg rounded-full bg-white border border-outline-variant flex items-center justify-between gap-xl min-w-[240px] hover:border-primary transition-all shadow-sm" onclick="Screens.toggleCountryFilter()">
              <div class="flex items-center gap-sm"><span class="material-symbols-outlined text-primary">public</span>
                <span class="font-body-bold" id="filter-label">전체 국가</span></div>
              <span class="material-symbols-outlined">expand_more</span>
            </button>
            <div id="country-filter-menu" class="absolute right-0 top-[60px] w-72 bg-white rounded-xl border border-outline-variant shadow-lg z-20 hidden overflow-hidden">
              <div class="max-h-64 overflow-y-auto p-sm" id="filter-options"></div>
            </div>
          </div>
        </div>
        <div class="bezel-card"><div class="bezel-inner overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead><tr class="bg-surface-container-low border-b border-outline-variant text-label-caps text-on-surface-variant">
              <th class="px-lg py-md">국가 정보</th><th class="px-lg py-md text-center">진단 스코어</th>
              <th class="px-lg py-md">시장 점수</th><th class="px-lg py-md">시스템 게이트</th>
              <th class="px-lg py-md">판정 / 상태</th><th class="px-lg py-md"></th>
            </tr></thead>
            <tbody class="divide-y divide-outline-variant/30" id="country-rows"></tbody>
          </table>
        </div></div>
      </div>
    </main>`;
  }

  function renderCountryRows() {
    const tbody = document.getElementById("country-rows");
    if (!tbody) return;
    const rows = window.Store.index.countries
      .filter((c) => listState.filter.has(c.code))
      .map((meta) => {
        const isBase = meta.role === "base";
        const r = isBase ? null : window.Store.analyze(meta.code);
        const scoreCell = isBase ? '<span class="text-outline text-sm">기준국</span>' : `<span class="font-display-lg text-[24px]" style="color:${VERDICT_COLOR[r.verdict]}">${fmt(r.total)}</span>`;
        const mkt = isBase ? "—" : fmt(r.categoryScores.MARKET);
        const mktPct = isBase ? 0 : Math.max(0, Math.min(100, r.categoryScores.MARKET || 0));
        const gate = isBase ? "—" : `<span style="color:${r.gatePassed ? '#006242' : '#ba1a1a'}">${r.gatePassed ? t("통과") : t("미달")} (${fmt(r.categoryScores.SYSTEM)})</span>`;
        const verdict = isBase
          ? `<span class="inline-flex items-center gap-xs px-md py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-body-bold">${t("진출 완료")}</span>`
          : `<span class="inline-flex items-center gap-xs px-md py-1 rounded-full text-xs font-body-bold" style="background:${VERDICT_COLOR[r.verdict]}1a;color:${VERDICT_COLOR[r.verdict]}"><span class="w-1.5 h-1.5 rounded-full" style="background:${VERDICT_COLOR[r.verdict]}"></span>${isEn() ? VERDICT_EN[r.verdict] : t(VERDICT_KO[r.verdict])}</span>`;
        return `<tr class="hover:bg-surface-container-lowest transition-colors cursor-pointer" onclick="App.go('country','${meta.code}')">
          <td class="px-lg py-lg"><div class="flex items-center gap-md"><div class="w-12 h-8 rounded bg-surface-container shadow-sm flex items-center justify-center text-2xl">${meta.flag || "🏳️"}</div>
            <div><div class="font-body-bold">${nameOf(meta)}</div><div class="text-xs text-outline">${meta.code} · ${meta.region}</div></div></div></td>
          <td class="px-lg py-lg text-center">${scoreCell}</td>
          <td class="px-lg py-lg"><div class="w-32 h-1.5 bg-surface-container rounded-full overflow-hidden"><div class="h-full rounded-full" style="width:${mktPct}%;background:${CAT_COLOR.MARKET}"></div></div>
            <span class="text-xs text-on-surface-variant mt-1 block">${mkt}</span></td>
          <td class="px-lg py-lg font-body-base text-sm">${gate}</td>
          <td class="px-lg py-lg">${verdict}</td>
          <td class="px-lg py-lg text-right"><span class="material-symbols-outlined text-outline">chevron_right</span></td>
        </tr>`;
      }).join("");
    tbody.innerHTML = rows || '<tr><td colspan="6" class="px-lg py-lg text-outline text-center">선택된 국가가 없습니다.</td></tr>';
    window.I18n.translateTree(tbody);
  }

  function renderFilterOptions() {
    const box = document.getElementById("filter-options");
    if (!box) return;
    box.innerHTML = window.Store.index.countries.map((c) => `
      <label class="flex items-center gap-md p-sm hover:bg-surface-container-low rounded-lg cursor-pointer">
        <input type="checkbox" class="w-5 h-5 rounded text-primary" ${listState.filter.has(c.code) ? "checked" : ""} onchange="Screens.toggleCountry('${c.code}', this.checked)"/>
        <span>${nameOf(c)} (${c.name})</span></label>`).join("");
  }
  function toggleCountryFilter() {
    const m = document.getElementById("country-filter-menu");
    if (m.classList.contains("hidden")) { renderFilterOptions(); m.classList.remove("hidden"); }
    else m.classList.add("hidden");
  }
  function toggleCountry(code, on) {
    if (on) listState.filter.add(code); else listState.filter.delete(code);
    const label = document.getElementById("filter-label");
    const total = window.Store.index.countries.length;
    if (label) label.textContent = listState.filter.size === total ? "전체 국가" : `${listState.filter.size}개 선택`;
    renderCountryRows();
  }
  const listState = { filter: new Set() };

  // ===================== M6 설정 =====================
  const CAT_SLIDERS = [
    { key: "MARKET", ko: "시장성 (Market)" },
    { key: "REGULATORY", ko: "규제 대응성 (Regulation)" },
    { key: "FINANCIAL", ko: "금융 환경 (Finance)" },
    { key: "SYSTEM", ko: "시스템 통합성 (System)" },
  ];

  function renderSettings() {
    const rs = window.Store.currentRuleset();
    const previewCode = (window.Store.plannedCountries()[0] || {}).code;
    settingsState.editing = {
      categoryWeights: { ...rs.categoryWeights },
      thresholds: { ...rs.thresholds },
      tierCoef: { ...rs.tierCoef },
    };
    settingsState.previewCode = previewCode;

    const catRows = CAT_SLIDERS.map((c) => {
      const pct = Math.round(rs.categoryWeights[c.key] * 100);
      return `
        <div class="space-y-sm">
          <div class="flex justify-between items-end">
            <span class="font-body-bold text-on-surface">${c.ko}</span>
            <span class="font-stat-lg text-primary text-[24px]" id="catval-${c.key}">${pct}%</span>
          </div>
          <input class="w-full" type="range" min="0" max="100" value="${pct}" id="catslider-${c.key}" oninput="Screens.onCatSlider('${c.key}', this.value)"/>
        </div>`;
    }).join("");

    const rulesetOptions = window.Store.rulesetList()
      .map((r) => `<option value="${r.id}">${r.name}</option>`).join("");

    return `
    <main class="pt-24 pb-xl px-margin-desktop max-w-[1440px] mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-end mb-xl gap-md">
        <div>
          <h1 class="font-headline-md text-headline-md">가중치 및 임계값 설정</h1>
          <p class="text-on-surface-variant mt-2">진단 엔진의 분석 파라미터를 조정하면 결과가 실시간으로 재계산됩니다.</p>
        </div>
        <div class="w-full md:w-80">
          <label class="font-label-caps text-outline mb-1 block">WEIGHTING RULESET ID</label>
          <select id="ruleset-select" class="w-full h-[52px] px-md bg-white border border-outline-variant rounded-full font-body-bold text-primary cursor-pointer hover:border-primary" onchange="Screens.onRulesetSelect(this.value)">
            ${rulesetOptions}
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <!-- 카테고리 가중치 -->
        <section class="md:col-span-8 bezel-card"><div class="bezel-inner p-xl h-full flex flex-col">
          <div class="flex justify-between items-center mb-xl">
            <div class="flex items-center gap-sm"><span class="material-symbols-outlined text-primary">category</span>
              <h2 class="font-headline-md text-headline-md">분류 항목별 가중치</h2></div>
            <div class="px-md py-1 rounded-full" id="total-weight-box" style="background:#dbe1ff">
              <span class="font-stat-lg text-primary" id="total-weight">100</span><span class="text-primary font-body-bold ml-1">%</span>
            </div>
          </div>
          <div class="space-y-lg flex-grow">${catRows}</div>
          <div class="mt-xl pt-lg border-t border-outline-variant/30 flex items-center gap-md text-on-surface-variant">
            <span class="material-symbols-outlined text-secondary">info</span>
            <p class="text-sm">합계가 100%가 아니어도 점수는 가중 평균으로 정규화됩니다. 저장 시 비율이 기록됩니다.</p>
          </div>
        </div></section>

        <!-- 임계값 + 실시간 미리보기 -->
        <section class="md:col-span-4 flex flex-col gap-gutter">
          <div class="bezel-card"><div class="bezel-inner p-xl">
            <div class="flex items-center gap-sm mb-lg"><span class="material-symbols-outlined text-secondary">tune</span>
              <h2 class="font-headline-md text-headline-md">임계값</h2></div>
            <div class="space-y-lg">
              <div class="space-y-sm">
                <div class="flex justify-between items-center"><span class="font-body-bold">이식 임계</span>
                  <span class="bg-surface-container px-sm py-xs rounded font-label-caps" id="thval-entry">${rs.thresholds.entry}</span></div>
                <input class="w-full" type="range" min="0" max="100" value="${rs.thresholds.entry}" oninput="Screens.onThreshold('entry', this.value)"/>
              </div>
              <div class="space-y-sm">
                <div class="flex justify-between items-center"><span class="font-body-bold">시스템 게이트</span>
                  <span class="bg-surface-container px-sm py-xs rounded font-label-caps" id="thval-systemGate">${rs.thresholds.systemGate}</span></div>
                <input class="w-full" type="range" min="0" max="100" value="${rs.thresholds.systemGate}" oninput="Screens.onThreshold('systemGate', this.value)"/>
              </div>
            </div>
          </div></div>

          <!-- 실시간 미리보기 -->
          <div class="bezel-card"><div class="bezel-inner p-xl" id="preview-box">
            <div class="flex items-center gap-sm mb-md"><span class="material-symbols-outlined text-tertiary">science</span>
              <h3 class="font-body-bold">실시간 재계산 미리보기</h3></div>
            <p class="text-sm text-outline mb-sm" id="preview-target">${previewCode ? window.Store.countryMeta(previewCode).name_ko + " vs " + window.Store.base.country_name : "대상 없음"}</p>
            <div id="preview-content"></div>
          </div></div>
        </section>

        <!-- 출처 신뢰도 계수 -->
        <section class="md:col-span-12 bezel-card"><div class="bezel-inner p-xl">
          <div class="flex items-center gap-sm mb-lg"><span class="material-symbols-outlined text-tertiary">database</span>
            <h2 class="font-headline-md text-headline-md">출처 신뢰도 계수 (Source Reliability)</h2></div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-xl">
            ${tierCard("TIER1", "Tier 1 (공식 1차)", "법령·감독기관·재무제표", "#004ac6", rs.tierCoef.TIER1)}
            ${tierCard("TIER2", "Tier 2 (준공식)", "협회·국제기구·빅4", "#575d78", rs.tierCoef.TIER2)}
            ${tierCard("TIER3", "Tier 3 (참고)", "2차 인용 자료", "#737686", rs.tierCoef.TIER3)}
          </div>
        </div></section>
      </div>

      <div class="mt-xxl flex justify-end items-center gap-md">
        <button class="px-xl h-14 rounded-full border border-outline-variant font-body-bold hover:bg-surface-container transition-all" onclick="Screens.resetSettings()">초기화</button>
        <button class="px-xxl h-14 rounded-full bg-primary text-white font-body-bold flex items-center gap-sm shadow-lg hover:-translate-y-0.5 transition-all" onclick="Screens.saveSettings()">
          <span>새 룰셋으로 저장</span>
          <div class="bg-white/20 p-1 rounded-full flex items-center justify-center"><span class="material-symbols-outlined text-[18px]">save</span></div>
        </button>
      </div>
    </main>`;
  }

  function tierCard(key, title, desc, color, val) {
    return `<div class="space-y-md p-md border border-outline-variant/20 rounded-xl bg-surface-container-low/30">
      <div class="flex justify-between items-center"><span class="font-body-bold" style="color:${color}">${title}</span>
        <span class="font-stat-lg text-[24px]" style="color:${color}" id="tierval-${key}">${val.toFixed(2)}</span></div>
      <input class="w-full" type="range" min="0" max="1" step="0.05" value="${val}" oninput="Screens.onTier('${key}', this.value)"/>
      <p class="text-on-surface-variant text-label-caps">${desc}</p>
    </div>`;
  }

  // 슬라이더 핸들러
  function onCatSlider(key, v) {
    const pct = parseInt(v, 10);
    document.getElementById("catval-" + key).textContent = pct + "%";
    settingsState.editing.categoryWeights[key] = pct / 100;
    updateTotalWeight();
    applyAndPreview();
  }
  function onThreshold(key, v) {
    const n = parseInt(v, 10);
    document.getElementById("thval-" + key).textContent = n;
    settingsState.editing.thresholds[key] = n;
    applyAndPreview();
  }
  function onTier(key, v) {
    const n = parseFloat(v);
    document.getElementById("tierval-" + key).textContent = n.toFixed(2);
    settingsState.editing.tierCoef[key] = n;
    applyAndPreview();
  }
  function updateTotalWeight() {
    const total = Object.values(settingsState.editing.categoryWeights).reduce((a, b) => a + b * 100, 0);
    const el = document.getElementById("total-weight");
    const box = document.getElementById("total-weight-box");
    if (el) el.textContent = Math.round(total);
    if (box) box.style.background = Math.round(total) === 100 ? "#dbe1ff" : "#ffdad6";
  }
  function applyAndPreview() {
    window.Store.applyRuleset(settingsState.editing);
    renderPreview();
  }
  function renderPreview() {
    const code = settingsState.previewCode;
    const box = document.getElementById("preview-content");
    if (!box || !code) return;
    const r = window.Store.analyze(code);
    if (!r) { box.innerHTML = '<p class="text-outline text-sm">미리보기 불가</p>'; return; }
    const vColor = VERDICT_COLOR[r.verdict];
    const cats = window.Store.CATEGORY_ORDER.map((c) =>
      `<div class="flex justify-between text-sm py-0.5"><span class="text-on-surface-variant">${t(window.Store.CATEGORY_KO[c])}</span><span class="font-body-bold" style="color:${CAT_COLOR[c]}">${fmt(r.categoryScores[c])}</span></div>`).join("");
    box.innerHTML = `
      <div class="flex items-end gap-2 mb-sm"><span class="font-stat-lg text-stat-lg" style="color:${vColor}">${fmt(r.total)}</span><span class="text-outline mb-1">/100</span>
        <span class="ml-auto font-label-caps px-sm py-xs rounded-full mb-1" style="background:${vColor}1a;color:${vColor}">${isEn() ? VERDICT_EN[r.verdict] : t(VERDICT_KO[r.verdict])}</span></div>
      <div class="border-t border-outline-variant/30 pt-sm">${cats}</div>
      <div class="text-xs text-outline mt-sm">${t("시스템 게이트")}: <b style="color:${r.gatePassed ? '#006242' : '#ba1a1a'}">${r.gatePassed ? t("통과") : t("미달")}</b> · ${t("유효신뢰도")} ${r.effConf}</div>`;
  }
  function onRulesetSelect(id) {
    const rs = window.Store.rulesetList().find((r) => r.id === id);
    if (!rs) return;
    window.Store.applyRuleset(rs);
    document.getElementById("screen-settings").innerHTML = renderSettings();
    window.I18n.applyDom(document.getElementById("screen-settings"));
    renderPreview();
  }
  function resetSettings() {
    window.Store.applyRuleset({ name: "디폴트 v1", categoryWeights: { MARKET: 0.25, REGULATORY: 0.25, FINANCIAL: 0.2, SYSTEM: 0.3 }, thresholds: { entry: 70, systemGate: 50, lowConfidence: 0.6 }, tierCoef: { TIER1: 1.0, TIER2: 0.8, TIER3: 0.5 } });
    document.getElementById("screen-settings").innerHTML = renderSettings();
    window.I18n.applyDom(document.getElementById("screen-settings"));
    renderPreview();
  }
  function saveSettings() {
    const n = window.Store.rulesetList().length;
    const name = "커스텀 v" + n;
    window.Store.saveRuleset(name, settingsState.editing);
    alert(`새 룰셋 "${name}" 저장 완료. 이후 분석·보고서에 적용됩니다.`);
    document.getElementById("screen-settings").innerHTML = renderSettings();
    window.I18n.applyDom(document.getElementById("screen-settings"));
    // 드롭다운에서 방금 저장한 룰셋 선택
    const sel = document.getElementById("ruleset-select");
    if (sel) sel.value = window.Store.rulesetList().slice(-1)[0].id;
    renderPreview();
  }

  const settingsState = { editing: null, previewCode: null };

  window.Screens = {
    renderCountry,
    renderCountryReport,
    renderRegion,
    renderRegionReport,
    renderCountries,
    renderCountryRows,
    toggleCountryFilter, toggleCountry,
    renderSettings,
    switchTab,
    switchRegionTab,
    onCatSlider, onThreshold, onTier, onRulesetSelect, resetSettings, saveSettings, renderPreview,
    _setReportCode: (c) => { state.reportCode = c; },
  };
})();
