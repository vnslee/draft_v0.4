/**
 * i18n.js — 한↔영 전체 전환
 * ui_design_guide.md 공통사항: 최상단 우측 국기 버튼으로 한국어/영어 전환,
 * 전환 시 전체 한글↔영문으로 변환.
 *
 * 사용: data-i18n="key" 속성을 가진 요소의 textContent를 현재 언어로 채운다.
 * 동적 렌더 텍스트는 t('key') 또는 t(koText) 헬퍼로 가져온다.
 */
(function () {
  const DICT = {
    // ===== 상단바 / 공통 =====
    "메인": "Main",
    "상세 진단": "Diagnostics",
    "권역 상세": "Region Detail",
    "국가 상세": "Country Detail",
    "국가 전체 보기": "All Countries",
    "보고서": "Reports",
    "권역 보고서": "Region Report",
    "국가 보고서": "Country Report",
    "환경 설정": "Settings",
    "가중치 설정": "Weights",
    "데이터 출처": "Data Sources",
    "이용약관": "Terms",
    "개인정보처리방침": "Privacy",
    "고객지원": "Support",

    // ===== M1 메인 =====
    "권역 선택": "Region Selection",
    "전체 보기": "Global Overview",
    "유럽": "Europe",
    "북미": "North America",
    "남미": "South America",
    "아시아·태평양": "APAC",
    "중동": "Middle East",
    "진출 완료": "Entered",
    "진출 예정": "Planned",
    "진출 완료 국가": "Entered Countries",
    "진출 예정 국가": "Planned Entry",
    "개": "",
    "권역": "Regions",
    "닫기": "Close",
    "분석 진행 중": "Analysis in progress",
    "상세보기": "Details",
    "진단 보고서 생성": "Generate Report",

    // ===== 판정 / 점수 =====
    "이식·확장 가능": "Transplantable",
    "심층조사 권고": "Deep Research",
    "진출 불가": "Blocked",
    "종합 유사도": "Overall Similarity",
    "시장": "Market",
    "규제": "Regulatory",
    "환경(금융)": "Financial",
    "금융": "Financial",
    "시스템": "System",
    "상품": "Product",
    "비교국": "Compared with",
    "시스템 게이트": "System Gate",
    "통과": "Pass",
    "미달": "Fail",
    "킬스위치": "Kill-switch",
    "전부 통과": "All passed",
    "유효신뢰도": "Effective Confidence",
    "추정 비용": "Estimated Cost",
    "비교국 대비": "vs. compared country",
    "공식 출처 미확보": "Non-official source",

    // ===== 프로그레스(P3) =====
    "시장 진입 분석 에이전트 가동 중": "Market entry agents running",
    "분석 상태": "Diagnostic Status",
    "보고서보기": "View Report",
    "에이전트가 실시간 데이터를 처리하고 있습니다...": "Agents are processing data...",
    "최종 분석 보고서를 생성하는 중입니다...": "Generating final report...",
    "모든 분석이 완료되었습니다. 보고서를 확인하십시오.": "Analysis complete. View the report.",
    "결과 생성": "Result Generation",
    "인구 및 구매력 분석": "Population & purchasing power",
    "법률 및 인허가 리스크": "Legal & licensing risk",
    "경쟁 제품 매칭도 분석": "Product matching",
    "공급망 인프라 연동 분석": "Infrastructure integration",

    // ===== M3 국가 상세 =====
    "기준(진출국)": "Base (entered)",
    "국가 종합 진단 지표": "Country Diagnostic Indicators",
    "주요 시스템 정보 (유사도)": "System Info (Similarity)",
    "AI 분석 요약": "AI Summary",
    "세부 통계 지표": "Detailed Indicators",
    "보고서 보기": "View Report",
    "시뮬레이션 실행": "Run Simulation",
    "카테고리": "Category",
    "지표명": "Indicator",
    "현재값": "Value",
    "유사도": "Similarity",
    "상태": "Status",
    "데이터 없음": "No data",
    "유사": "Similar", "보통": "Moderate", "상이": "Different", "데이터없음": "No data",

    // ===== M5 보고서 =====
    "요약": "Summary", "판정근거": "Verdict Basis", "비용 추정": "Cost", "리스크": "Risk",
    "가중치": "Weights", "출처": "Sources",
    "종합 진단 결과": "Overall Diagnostic",
    "시장 진입 타당성 및 매력도 스코어": "Market entry feasibility & attractiveness",
    "AI 진단 제언": "AI Recommendation",
    "항목": "Item", "유사도": "Similarity", "신뢰": "Conf.", "방식": "Method",
    "추정 비용": "Estimated Cost", "비교국 대비": "vs. compared country",
    "유사도 구간별 비용 변환표": "Similarity→Cost conversion table",
    "종합 유사도": "Overall Similarity", "비용 비율": "Cost ratio", "의미": "Meaning",
    "핵심 리스크 요인": "Key Risks", "진입 전략 제언": "Entry Strategy",
    "카테고리 가중치": "Category Weights", "임계값 / 신뢰도 계수": "Thresholds / Coefficients",
    "이식 임계": "Entry threshold", "시스템 게이트 하한": "System gate floor", "저신뢰 기준": "Low-confidence",
    "공식(Tier1) 계수": "Official (T1)", "준공식(Tier2) 계수": "Semi (T2)", "참고(Tier3) 계수": "Ref (T3)",
    "출처 목록 (Tier1 공식 우선 인용)": "Sources (Tier1 official cited first)",
    "등급": "Tier", "공식 1차": "Official", "준공식": "Semi", "참고": "Reference", "차단": "Blocked",

    // ===== M2/M4 권역 =====
    "진출 완료 국가": "Entered Countries", "권역 경쟁력 요약": "Regional Competitiveness",
    "국가별 순위 — 카테고리 분해": "Country Ranking — Category Breakdown",
    "순위 / 국가": "Rank / Country", "종합 점수": "Total Score", "판정": "Verdict",
    "진단 어드바이스": "Diagnostic Advice",
    "진출 우선순위": "Entry Priority", "권역 평균 유사도": "Regional Avg. Similarity",
    "권역 상세정보": "Region Detail",

    // ===== M6 설정 =====
    "가중치 및 임계값 설정": "Weights & Thresholds",
    "분류 항목별 가중치": "Category Weights", "임계값": "Thresholds",
    "실시간 재계산 미리보기": "Live Recalculation Preview",
    "출처 신뢰도 계수 (Source Reliability)": "Source Reliability Coefficients",
    "초기화": "Reset", "새 룰셋으로 저장": "Save as new ruleset",
    "이식 임계": "Entry threshold",

    // ===== M7 국가 리스트 =====
    "국가 리스트": "Country List",
    "전체 국가": "All Countries", "국가 정보": "Country", "진단 스코어": "Score",
    "시장 점수": "Market Score", "판정 / 상태": "Verdict / Status", "기준국": "Base",

    // ===== 공통 문구·버튼·설명문 =====
    "보고서 PDF 다운로드": "Download PDF",
    "전체 국가의 진단 스코어·판정·진출 현황을 한눈에 확인합니다.": "See diagnostic scores, verdicts, and entry status for all countries at a glance.",
    "진단 엔진의 분석 파라미터를 조정하면 결과가 실시간으로 재계산됩니다.": "Adjust the engine's parameters and results recalculate in real time.",
    "권역 내 진출 예정국을 종합 유사도 기준으로 정렬하고 카테고리별 점수를 분해해 진출 우선순위를 제시합니다.": "Ranks planned countries in the region by overall similarity and breaks down category scores to suggest entry priority.",
    "이 권역의 기준(진출) 국가": "Base (entered) countries of this region",
    "Regional expansion diagnostic report": "Regional expansion diagnostic report",
    "이 권역에 진출 예정국 데이터가 없습니다.": "No planned-country data for this region.",
    "선택된 국가가 없습니다.": "No countries selected.",
    "데이터 없음": "No data",
    "없음": "None",
    "합계가 100%가 아니어도 점수는 가중 평균으로 정규화됩니다. 저장 시 비율이 기록됩니다.": "Even if the total isn't 100%, scores are normalized by weighted average. The ratio is saved.",
    "설정(M6)에서 변경 시 새 룰셋 버전으로 저장되어 과거 보고서는 그대로 재현됩니다.": "Changes in Settings (M6) are saved as a new ruleset version, so past reports remain reproducible.",
    "유사도→비용은 비선형. 진출국 실적이 누적되면 함수로 고도화(설계서 6.4·8장).": "Similarity→cost is non-linear; refined into a function as entry records accumulate.",

    // ===== P4 룰셋 팝업 =====
    "가중치 룰셋 설정": "Weighting Ruleset",
    "진단에 적용할 가중치 기준을 선택하세요.": "Select the weighting basis for the diagnostic.",
    "룰셋 선택": "Select ruleset",
    "룰셋 세부 가중치": "Ruleset weight details",
    "실행": "Run",
    "진단 보고서 생성": "Generate Report",
  };

  // 역방향(영→한) 사전
  const REV = {};
  for (const [ko, en] of Object.entries(DICT)) if (en) REV[en] = ko;

  const state = { lang: localStorage.getItem("lang") || "ko" };

  function t(ko) {
    if (state.lang === "ko") return ko;
    return DICT[ko] != null ? DICT[ko] : ko;
  }

  function applyDom(root) {
    (root || document).querySelectorAll("[data-i18n]").forEach((el) => {
      const ko = el.getAttribute("data-i18n");
      el.textContent = t(ko);
    });
    if (state.lang === "en") translateTree(root || document.body);
    document.documentElement.lang = state.lang;
  }

  /**
   * 동적 렌더된 HTML의 정적 한글을 사전 기준으로 일괄 번역(영어 모드 전용).
   * 텍스트 노드를 순회하며, trim된 내용이 사전에 정확히 매칭되면 영어로 치환한다.
   * (한글 템플릿으로 매번 재렌더 → 영어면 이 패스 적용하는 구조)
   */
  function translateTree(root) {
    if (state.lang !== "en") return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach((node) => {
      const raw = node.nodeValue;
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (DICT[trimmed] != null && DICT[trimmed] !== "") {
        node.nodeValue = raw.replace(trimmed, DICT[trimmed]);
      }
    });
  }

  function setLang(lang) {
    state.lang = lang;
    localStorage.setItem("lang", lang);
    applyDom();
    window.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  window.I18n = {
    t,
    setLang,
    applyDom,
    translateTree,
    get lang() { return state.lang; },
  };
})();
