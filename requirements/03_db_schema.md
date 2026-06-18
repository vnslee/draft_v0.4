# DB 스키마 — MongoDB

> 버전 v0.1 · 작성일 2026-06-16
> 선행 문서: `docs/design/03_데이터스키마정의서.md`
> DB: MongoDB Atlas / 로컬 개발은 mongod 또는 Docker `mongo:7`

---

## 0. 설계 원칙

- 설계서 스키마(RDB 논리 모델)를 MongoDB 컬렉션으로 매핑
- 참조 관계는 `ObjectId` 레퍼런스 사용 (JOIN 대신 application-level lookup)
- 보고서 재현성을 위해 `weight_snapshot`은 REPORT 문서에 전체 사본 저장
- `loaders.py`가 유일한 접근점 — 컬렉션 이름 변경 시 여기만 수정

---

## 1. 컬렉션 목록

| 컬렉션 | 설계서 엔터티 | 비고 |
|---|---|---|
| `countries` | COUNTRY | 국가 마스터 |
| `entry_records` | ENTRY_RECORD | 진출국 실적 |
| `research_snapshots` | RESEARCH_SNAPSHOT | 조사 회차 |
| `research_items` | RESEARCH_ITEM | 조사 항목 값 |
| `catalog_categories` | CATALOG_CATEGORY | 카테고리 마스터 |
| `catalog_items` | CATALOG_ITEM | 항목 마스터 |
| `weight_rulesets` | WEIGHT_RULESET + WEIGHT_ITEM | 가중치 룰셋 |
| `similarity_results` | SIMILARITY_RESULT + CATEGORY_SCORE | 분석 결과 |
| `ranking_results` | RANKING_RESULT | 권역 순위 |
| `reports` | REPORT | 근거 보고서 |
| `analysis_jobs` | (신규) | 진행 중 분석 상태 추적 |

---

## 2. 스키마 정의

### 2.1 `countries`

```js
{
  _id: ObjectId,
  country_id: String,       // "IN", "KR", "DE" (ISO 3166-1 alpha-2)
  name: String,             // "인도"
  name_en: String,          // "India"
  region: String,           // "APAC" | "EUROPE" | "AMERICAS"
  entry_status: String,     // "ENTERED" | "NOT_ENTERED"
  flag_emoji: String,       // "🇮🇳"
  created_at: Date
}
// 인덱스: { country_id: 1 } unique, { region: 1, entry_status: 1 }
```

---

### 2.2 `entry_records`

```js
{
  _id: ObjectId,
  entry_id: String,
  country_id: String,             // FK → countries.country_id
  entry_date: Date,
  prep_period_days: Number,
  prep_cost_usd: Number,
  cost_breakdown: {               // 항목별 비용 분해
    license: Number,
    incorporation: Number,
    system: Number,
    advisory: Number,
    staffing: Number,
    other: Number
  },
  system_info: {
    infra: String,
    products: [String],
    core_system: String,
    vendor: String
  },
  reg_snapshot_date: Date,
  reg_snapshot: Object            // 진출 시점 규제 스냅샷 (자유 형태)
}
// 인덱스: { country_id: 1 } unique
```

---

### 2.3 `research_snapshots`

```js
{
  _id: ObjectId,
  snapshot_id: String,
  country_id: String,
  survey_date: Date,              // NOT NULL
  data_kind: String,              // "ENTRY_PREP" | "CURRENT"
  created_by: String,             // "agent" | "user"
  status: String,                 // "DRAFT" | "CONFIRMED"
  created_at: Date
}
// 인덱스: { country_id: 1, survey_date: -1 }
```

---

### 2.4 `research_items`

```js
{
  _id: ObjectId,
  item_id: String,
  snapshot_id: String,            // FK → research_snapshots.snapshot_id
  catalog_item_id: String,        // FK → catalog_items.catalog_item_id
  value_raw: String,              // 원본 값 ("58%", "₹10cr", null)
  value_normalized: Mixed,        // 정규화 값. RANGE: { min, max }
  is_missing: Boolean,            // value_raw가 null이면 true (null ≠ 0)
  source_name: String,
  source_url: String,
  source_type: String,            // "LAW"|"FINANCIAL_STATEMENT"|"REGULATOR"|"ASSOCIATION"|"INTL_ORG"|"SECONDARY"|"FIELD"
  source_tier: String,            // "TIER1"|"TIER2"|"TIER3"|"BLOCKED"
  is_official: Boolean,           // TIER1 여부
  official_gap_flag: Boolean,     // 공식 출처 미확보로 TIER2·3 사용 시 true
  confidence_grade: String,       // "OFFICIAL"|"SEMI_OFFICIAL"|"ESTIMATED"
  survey_date: Date,              // 항목 단위 조사일
  evidence: String,               // LLM 추출 근거 문장
  condition: String               // 조건부 규정 (예: "JV 시 100% 가능")
}
// 인덱스: { snapshot_id: 1 }, { catalog_item_id: 1 }
```

---

### 2.5 `catalog_categories`

```js
{
  _id: ObjectId,
  category_id: String,            // "MARKET"|"REGULATORY"|"FINANCIAL"|"SYSTEM"
  name: String,
  name_en: String,
  default_weight: Number,         // 0.25, 0.25, 0.20, 0.30
  is_gate: Boolean,               // SYSTEM만 true
  gate_threshold: Number          // 50
}
```

---

### 2.6 `catalog_items`

```js
{
  _id: ObjectId,
  catalog_item_id: String,        // "MKT_001", "REG_001" ...
  category_id: String,
  sub_category: String,           // "1-1", "2-3" 등 정의서 절 코드
  name: String,                   // "금융 침투율(신차)"
  name_en: String,
  similarity_type: String,        // "CONTINUOUS"|"CATEGORICAL"|"BINARY"|"REFERENCE"
  data_type: String,              // "NUMBER"|"PERCENT"|"TEXT"|"CODE"|"DATE"|"MULTI"|"RANGE"
  default_item_weight: Number,
  is_killswitch: Boolean,
  killswitch_rule: Object         // { operator: "LTE", threshold: 49, field: "value_normalized" }
}
// 시드 데이터: docs/design/02_데이터카테고리정의서.md 전 항목
// 인덱스: { category_id: 1 }
```

---

### 2.7 `weight_rulesets`

```js
{
  _id: ObjectId,
  ruleset_id: String,
  name: String,
  is_default: Boolean,
  category_weights: {             // 카테고리별 가중치
    MARKET: 0.25,
    REGULATORY: 0.25,
    FINANCIAL: 0.20,
    SYSTEM: 0.30
  },
  item_weights: [                 // 항목별 오버라이드 (없으면 catalog_items.default_item_weight 사용)
    { catalog_item_id: "REG_001", weight: 0.15 }
  ],
  thresholds: {
    entry: 70,
    system_gate: 50
  },
  confidence_coef: {
    OFFICIAL: 1.0,
    SEMI_OFFICIAL: 0.8,
    ESTIMATED: 0.5
  },
  killswitch_settings: [
    { catalog_item_id: "REG_001", enabled: true, threshold: 49 }
  ],
  created_at: Date,
  is_locked: Boolean              // 보고서 참조 시 true로 변경 — 이후 수정 불가
}
// 인덱스: { ruleset_id: 1 } unique, { is_default: 1 }
```

---

### 2.8 `similarity_results`

```js
{
  _id: ObjectId,
  result_id: String,
  target_country_id: String,
  compared_country_id: String,    // 최고 유사 진출국
  compared_all: [                 // 권역 내 전체 비교 결과
    { country_id: "KR", total_score: 74 }
  ],
  ruleset_id: String,
  target_snapshot_id: String,
  total_score: Number,            // 0~100
  verdict: String,                // "TRANSPLANTABLE"|"DEEP_RESEARCH"|"BLOCKED"
  killswitch_hit: [String],       // 막힌 항목 catalog_item_id 목록
  cost_estimate_ratio: Number,    // 비교국 대비 비율 (0.6 = 60%)
  cost_estimate_usd: Number,
  category_scores: [
    {
      category_id: String,
      raw_score: Number,
      weighted_score: Number,
      gate_passed: Boolean,
      item_scores: [              // 항목별 유사도 (근거 보관용)
        { catalog_item_id: String, similarity: Number, confidence_grade: String }
      ]
    }
  ],
  run_date: Date
}
// 인덱스: { target_country_id: 1, run_date: -1 }, { result_id: 1 } unique
```

---

### 2.9 `ranking_results`

```js
{
  _id: ObjectId,
  ranking_id: String,
  region: String,
  ruleset_id: String,
  run_date: Date,
  items: [
    {
      country_id: String,
      rank: Number,
      total_score: Number,
      verdict: String,
      result_id: String,          // → similarity_results 참조
      category_scores: Object     // 카테고리별 점수 스냅샷
    }
  ]
}
```

---

### 2.10 `reports`

```js
{
  _id: ObjectId,
  report_id: String,
  result_id: String,              // → similarity_results (nullable: 기능2이면 ranking_id 사용)
  ranking_id: String,
  summary: String,
  ai_insight: String,
  detail: {
    market: [ { item: String, baseline: Mixed, target: Mixed, similarity: Number, source_tier: String } ],
    regulatory: [],
    financial: [],
    system: []
  },
  sources: [
    { name: String, url: String, tier: String, is_official: Boolean }
  ],
  weight_snapshot: Object,        // ruleset 전체 사본 (재현성 — ruleset 삭제돼도 자립)
  survey_dates: {
    target: String,
    baseline_snapshot: String
  },
  generated_at: Date
}
// 인덱스: { report_id: 1 } unique, { result_id: 1 }
```

---

### 2.11 `analysis_jobs` (신규 — 분석 진행 상태)

```js
{
  _id: ObjectId,
  analysis_id: String,
  mode: String,                   // "single" | "region"
  target_country_id: String,
  target_region: String,
  ruleset_id: String,
  status: String,                 // "RUNNING"|"COMPLETED"|"FAILED"|"CANCELLED"
  overall_progress: Number,
  agents: {
    market:      { progress: Number, status: String, message: String, started_at: Date, completed_at: Date },
    regulation:  { progress: Number, status: String, message: String, started_at: Date, completed_at: Date },
    environment: { progress: Number, status: String, message: String, started_at: Date, completed_at: Date },
    system:      { progress: Number, status: String, message: String, started_at: Date, completed_at: Date },
    summary:     { progress: Number, status: String, message: String, started_at: Date, completed_at: Date }
  },
  result_id: String,              // 완료 시 채워짐
  started_at: Date,
  completed_at: Date,
  error: String
}
// 인덱스: { analysis_id: 1 } unique, { status: 1, started_at: -1 }
// TTL 인덱스: { started_at: 1 } expireAfterSeconds: 86400 (24h 자동 삭제)
```

---

## 3. 시드 데이터

MongoDB 기동 시 아래 컬렉션을 초기 적재한다.

| 컬렉션 | 소스 | 내용 |
|---|---|---|
| `countries` | `data/countries/countries.json` | 13개국 기본 정보 |
| `catalog_categories` | 하드코딩 | 4개 카테고리 |
| `catalog_items` | `docs/design/02_데이터카테고리정의서.md` | 전 항목 |
| `weight_rulesets` | 하드코딩 | "디폴트" 룰셋 1건 |
| `entry_records` | `data/baseline/entry_baseline.json` | 진출국 실적 (현재 목업) |
| `research_snapshots` + `research_items` | `data/regulations/`, `data/auto_finance_market/` 등 | 목업 조사 데이터 |

---

## 4. 환경별 연결

```
# .env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/auto_finance  # 프로덕션
MONGODB_URI=mongodb://localhost:27017/auto_finance                     # 로컬
DB_NAME=auto_finance
```

`loaders.py`에서 `MONGODB_URI` 환경변수로 연결. 미설정 시 `data/` 폴더 JSON 모드로 폴백.
