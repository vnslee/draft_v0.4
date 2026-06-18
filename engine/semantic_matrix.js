/**
 * 의미 기반 유사도 매트릭스 (semantic_matrix.js)
 * ============================================================
 * 토큰 매칭(글자 겹침)을 대체. 각 범주형 항목의 코드값 쌍별 유사도(0~1)를
 * 진출(이식) 관점에서 도메인 판단으로 정의.
 *
 * 사용: 양방향 동일. [A][B] 없으면 [B][A] 조회, 둘 다 없으면 동일=1.0/상이=null(fallback)
 * 대각(자기자신)=1.0은 자동.
 */
const SEMANTIC_MATRIX = {

  // ===== MARKET =====
  MKT_DLR_TYPE: { // 딜러 유형 구조 — 채널 구성의 유사성
    FRANCHISE_INDEPENDENT_MIX: { FRANCHISE_DIRECT_ONLINE_MIX: 0.6, FRANCHISE_DOMINANT: 0.7 },
    // 영국(프랜차이즈+독립) vs 폴란드(프랜차이즈+직판+온라인): 프랜차이즈 공통, 채널 다양성 차이
  },
  MKT_DLR_MULTIBRAND: { // 멀티브랜드 — 시장 성숙 단계
    COMMON: { GROWING: 0.6, RARE: 0.2 },
    // 보편화 vs 성장중: 방향 같고 단계 차이 → 0.6 (토큰매칭 0점은 틀림)
  },
  MKT_DLR_FI: { // F&I 관행 — 금융 판매 구조 (진출 전략 직결)
    POS_DOMINANT: { LEASE_DOMINANT: 0.3, BANK_SEPARATE: 0.2, ESTABLISHED: 0.7 },
    // POS 중심(영국) vs 리스 중심(폴란드): 둘 다 채널내 금융이나 상품·구조 크게 달라 0.3
  },

  // ===== REGULATORY =====
  REG_LICENSE_TYPE: { // 라이선스 체계 — 인허가 난이도/성격
    FCA_CONSUMER_CREDIT: { KNF_LENDER_REG: 0.4, EU_PASSPORT: 0.5 },
    // FCA 정식인가(영국) vs KNF 등록제+B2B면제(폴란드): 둘 다 감독당국 관할이나 강도·범위 달라 0.4
  },
  REG_ENTITY_FORM: { // 법인형태 — 설립 절차 유사성
    LTD_PLC: { SPZOO_SA: 0.7, GMBH_AG: 0.8 },
    // 유한/주식회사 구조는 본질적으로 유사(영국 Ltd/PLC ≈ 폴란드 Sp.zo.o./S.A.) → 0.7
  },
  REG_PRIVACY_LAW: { // 개인정보보호 — 컴플라이언스 부담 유사성
    UK_GDPR: { EU_GDPR: 0.9, PDPA: 0.5, CCPA: 0.4 },
    EU_GDPR: { PDPA: 0.5, CCPA: 0.4 },
    // UK GDPR은 EU GDPR에서 분기, UK가 EU 적정성 보유 → 거의 동일 0.9 (토큰매칭 33점은 과소)
  },
  REG_DATA_TRANSFER: { // 국외이전 — 데이터 이전 자유도
    ADEQUACY_SCC: { EU_FREE: 0.7, RESTRICTED: 0.2, LOCALIZED: 0.0 },
    EU_FREE: { RESTRICTED: 0.3, LOCALIZED: 0.0 },
    // 영국(적정성/SCC 기반 이전) vs 폴란드(EU역내 자유): 둘 다 이전 가능, 절차 차이 → 0.7 (0점은 틀림)
  },
  REG_PROVISION: { // 충당금 — 회계기준
    IFRS9: { LOCAL_GAAP: 0.5, IFRS9_OR_LOCAL: 0.85 },
    // 동일 IFRS9 → 1.0 (자동)
  },
  REG_CB_INFRA: { // 신용정보 인프라 — 여신심사 환경
    PRIVATE_3BUREAU: { BIK_CENTRAL: 0.5, NONE: 0.0, STATE_REGISTRY: 0.4 },
    // 영국(3사 경쟁) vs 폴란드(BIK 중앙집중): 둘 다 성숙한 CB 존재, 구조 달라 0.5 (0점은 틀림)
  },
  REG_COLLECTION: { // 추심 규제 — 회수 환경 (손실률 직결)
    FCA_CONC: { CIVIL_COURT_BAILIFF: 0.5, SELF_HELP: 0.3, COURT_ONLY: 0.4 },
    // 영국(규제기반 추심) vs 폴란드(사법집행): 회수 가능성·강도는 둘 다 중상, 경로 달라 0.5
  },
  REG_REPOSSESS: { // 차량회수 절차 — 담보 회수 실효성
    CCA_PROTECTED_GOODS: { LEASE_OWNERSHIP: 0.4, FREE_REPO: 0.3, COURT_ORDER: 0.6 },
    // 영국(1/3룰 보호, 법원경유) vs 폴란드(리스 소유권 기반 회수): 폴란드가 회수 더 유리, 구조 상이 0.4
  },
  REG_AUTO_INS: { // 의무보험
    MANDATORY: { OPTIONAL: 0.2, MANDATORY_PLUS: 0.9 },
    // 동일 MANDATORY → 1.0 (자동)
  },
  REG_CREDIT_LIFE: { // 신용생명보험 — 부가상품 여지
    ALLOWED_STRICT: { ALLOWED: 0.7, BANNED: 0.0, ALLOWED_FREE: 0.6 },
    // 영국(가능하나 엄격) vs 폴란드(가능): 둘 다 허용, 규제 강도 차이 → 0.7
  },
  REG_INS_TYING: { // 보험 끼워팔기 규제 — 부가상품 판매 제약
    REGULATED_DUTY: { CONSUMER_PROTECTED: 0.6, BANNED: 0.3, FREE: 0.2 },
    // 영국(add-on 규제+Duty) vs 폴란드(소비자보호 규제): 둘 다 규제 존재, 방식 유사 → 0.6 (0점은 틀림)
  },

  // ===== FINANCIAL =====
  FIN_CAPTIVE_TYPE: { // 캡티브 구조 — 경쟁 환경
    CAPTIVE_DOMINANT_NEW: { BANK_LEASING_DOMINANT: 0.3, CAPTIVE_DOMINANT: 0.8, INDEPENDENT: 0.2 },
    // 영국(신차 캡티브 주도) vs 폴란드(은행계 리스 우위): 공급자 성격 크게 달라 0.3
  },

  // ===== SYSTEM =====
  SYS_SOL_TYPE: { // 솔루션 유형 — 시스템 도입 방식
    PACKAGE_SAAS_SI: { PACKAGE_SI_CLOUD: 0.7, SAAS_ONLY: 0.5, FULL_INHOUSE: 0.2 },
    // 영국(패키지+SaaS+SI) vs 폴란드(패키지+SI+클라우드): 패키지·SI 공통, 배포방식 일부 차이 0.7
  },
  SYS_PAYMENT_INFRA: { // 결제·정산 인프라 — 연동 부담
    BACS_DD: { BIK_CEPIK_KSEF: 0.4, SEPA_DD: 0.7, CARD_ONLY: 0.3 },
    // 영국(BACS/Direct Debit) vs 폴란드(BIK/CEPiK/KSeF 연동): 둘 다 자동결제+공적 인프라 연동, 구체 시스템 달라 0.4 (0점은 틀림)
  },
};

// 매트릭스 조회 (양방향)
function semanticSim(itemId, a, b) {
  if (a === b) return 1.0;
  const m = SEMANTIC_MATRIX[itemId];
  if (!m) return null; // 매트릭스 없으면 fallback
  if (m[a] && m[a][b] != null) return m[a][b];
  if (m[b] && m[b][a] != null) return m[b][a];
  return null; // 정의 안 된 쌍 → fallback
}

if (typeof module !== "undefined") module.exports = { SEMANTIC_MATRIX, semanticSim };
if (typeof window !== "undefined") window.SemanticMatrix = { SEMANTIC_MATRIX, semanticSim };
