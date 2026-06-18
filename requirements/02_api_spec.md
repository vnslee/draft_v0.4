# API 명세

> 버전 v0.1 · 작성일 2026-06-16
> Base URL: `http://localhost:8000/api/v1`
> WebSocket: `ws://localhost:8000/ws`

---

## 1. 분석 (Analysis)

### POST `/analysis/run`
단일 국가 진단 또는 권역 분석을 시작한다.

**Request**
```json
{
  "mode": "single" | "region",
  "target_country_id": "IN",        // mode=single 시
  "target_region": "APAC",          // mode=region 시
  "ruleset_id": "default"           // 생략 시 현재 디폴트 룰셋 사용
}
```

**Response 202**
```json
{
  "analysis_id": "ana_abc123",
  "status": "RUNNING",
  "ws_url": "/ws/analysis/ana_abc123"
}
```

---

### GET `/analysis/{analysis_id}`
분석 현재 상태 조회 (WebSocket 폴백용).

**Response 200**
```json
{
  "analysis_id": "ana_abc123",
  "mode": "single",
  "target_country_id": "IN",
  "status": "RUNNING" | "COMPLETED" | "FAILED",
  "overall_progress": 65,
  "agents": {
    "market":      { "progress": 100, "status": "completed", "message": "시장 분석 완료" },
    "regulation":  { "progress": 75,  "status": "running",   "message": "라이선스 요건 조사 중" },
    "environment": { "progress": 40,  "status": "running",   "message": "금리 데이터 수집 중" },
    "system":      { "progress": 90,  "status": "running",   "message": "코어시스템 평가 중" },
    "summary":     { "progress": 0,   "status": "waiting",   "message": "Phase 1 완료 후 시작" }
  },
  "result_id": null,
  "started_at": "2026-06-16T10:00:00Z"
}
```

---

### DELETE `/analysis/{analysis_id}`
진행 중 분석 취소.

**Response 200**
```json
{ "cancelled": true }
```

---

## 2. 국가 (Countries)

### GET `/countries`
국가 목록 반환.

**Query params**: `region=APAC`, `entry_status=NOT_ENTERED`

**Response 200**
```json
{
  "countries": [
    {
      "country_id": "IN",
      "name": "인도",
      "region": "APAC",
      "entry_status": "NOT_ENTERED",
      "flag": "🇮🇳",
      "latest_analysis": {
        "result_id": "res_xyz",
        "verdict": "TRANSPLANTABLE",
        "total_score": 74,
        "run_date": "2026-06-15T09:00:00Z"
      }
    }
  ]
}
```

---

### GET `/countries/{country_id}`
국가 상세 + 최근 분석 결과.

**Response 200**: 위 단건 객체 + `entry_record`(진출국이면 실적 포함).

---

## 3. 결과 (Results)

### GET `/results/{result_id}`
분석 결과 상세 (점수 분해 포함).

**Response 200**
```json
{
  "result_id": "res_abc123",
  "target_country_id": "IN",
  "compared_country_id": "KR",
  "ruleset_id": "default",
  "total_score": 74,
  "verdict": "TRANSPLANTABLE",
  "killswitch_hit": null,
  "cost_estimate_ratio": 0.60,
  "cost_estimate_usd": 4200000,
  "category_scores": [
    { "category_id": "MARKET",     "raw_score": 68, "weighted_score": 17.0, "gate_passed": true },
    { "category_id": "REGULATORY", "raw_score": 71, "weighted_score": 17.75, "gate_passed": true },
    { "category_id": "FINANCIAL",  "raw_score": 75, "weighted_score": 15.0, "gate_passed": true },
    { "category_id": "SYSTEM",     "raw_score": 80, "weighted_score": 24.0, "gate_passed": true }
  ],
  "run_date": "2026-06-16T10:02:30Z"
}
```

---

### GET `/results?country_id=IN&limit=10`
국가별 분석 이력.

---

## 4. 보고서 (Reports)

### GET `/reports/{report_id}`
근거 보고서 전문.

**Response 200**
```json
{
  "report_id": "rpt_abc123",
  "result_id": "res_abc123",
  "summary": "인도는 아태 권역 한국 대비 종합 유사도 74점으로 이식 가능 판정...",
  "ai_insight": "규제 환경은 유사하나 코어시스템 벤더 락인 수준이 낮아 시스템 이식 용이...",
  "detail": {
    "market": [ { "item": "금융침투율", "baseline": "65%", "target": "58%", "similarity": 0.82, "source_tier": "TIER2" } ],
    "regulatory": [],
    "financial": [],
    "system": []
  },
  "sources": [
    { "name": "RBI Annual Report 2024", "url": "https://rbi.org.in/...", "tier": "TIER1" }
  ],
  "weight_snapshot": {
    "MARKET": 0.25, "REGULATORY": 0.25, "FINANCIAL": 0.20, "SYSTEM": 0.30,
    "thresholds": { "entry": 70, "system_gate": 50 },
    "confidence_coef": { "OFFICIAL": 1.0, "SEMI_OFFICIAL": 0.8, "ESTIMATED": 0.5 }
  },
  "survey_dates": { "target": "2026-06-16", "baseline_snapshot": "2024-12-01" },
  "generated_at": "2026-06-16T10:03:00Z"
}
```

---

## 5. 설정 — 가중치 룰셋 (Settings)

### GET `/settings/rulesets`
룰셋 목록.

**Response 200**
```json
{
  "rulesets": [
    { "ruleset_id": "default", "name": "디폴트", "is_default": true, "is_locked": false, "created_at": "..." }
  ]
}
```

---

### POST `/settings/rulesets`
새 룰셋 생성 (기존 수정 금지 — 항상 새 버전).

**Request**
```json
{
  "name": "시스템 가중치 강화",
  "based_on": "default",
  "category_weights": {
    "MARKET": 0.20, "REGULATORY": 0.25, "FINANCIAL": 0.15, "SYSTEM": 0.40
  },
  "thresholds": { "entry": 70, "system_gate": 50 },
  "confidence_coef": { "OFFICIAL": 1.0, "SEMI_OFFICIAL": 0.8, "ESTIMATED": 0.5 },
  "killswitch_overrides": {
    "foreign_ownership_limit": { "enabled": true },
    "fx_remittance_restriction": { "enabled": true }
  }
}
```

**Response 201**
```json
{ "ruleset_id": "rs_xyz789", "name": "시스템 가중치 강화" }
```

---

### GET `/settings/rulesets/{ruleset_id}`
룰셋 상세.

---

## 6. 데이터 관리 (Data)

### GET `/data/snapshots?country_id=IN`
국가별 조사 회차 목록.

### POST `/data/snapshots`
새 조사 회차 생성 (S5 — 조사 데이터 입력).

**Request**
```json
{
  "country_id": "IN",
  "survey_date": "2026-06-16",
  "data_kind": "CURRENT",
  "items": [
    {
      "catalog_item_id": "MKT_001",
      "value_raw": "58%",
      "value_normalized": 0.58,
      "source_name": "SIAM Annual Report 2024",
      "source_url": "https://siam.in/...",
      "source_type": "ASSOCIATION",
      "source_tier": "TIER2"
    }
  ]
}
```

---

## 7. WebSocket

### `WS /ws/analysis/{analysis_id}`

연결 즉시 현재 상태 스냅샷 수신. 이후 `progress`, `completed`, `error` 메시지 스트리밍.

자세한 메시지 포맷은 `docs/impl/01_architecture.md` 4절 참조.

---

## 8. 공통 에러 포맷

```json
{
  "error": {
    "code": "ANALYSIS_NOT_FOUND" | "RULESET_LOCKED" | "NO_BASELINE_DATA" | ...,
    "message": "분석 결과를 찾을 수 없습니다.",
    "detail": {}
  }
}
```

| 상태코드 | 의미 |
|---|---|
| 400 | 잘못된 요청 파라미터 |
| 404 | 리소스 없음 |
| 409 | 룰셋 잠금 충돌 (수정 시도) |
| 422 | 비교 대상 없음 (같은 권역 진출국 없음) |
| 503 | Claude API 일시 불가 |
