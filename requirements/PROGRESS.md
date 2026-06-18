# 구현 진행 현황

> 최종 업데이트: 2026-06-16
> 현재 단계: Phase 4 완료

---

## 진행 요약

| Phase | 내용 | 상태 |
|---|---|---|
| Phase 0 | 기반 설정 | ✅ 완료 |
| Phase 1 | 백엔드 코어 | ✅ 완료 |
| Phase 2 | 에이전트 구현 | ✅ 완료 |
| Phase 3 | 프론트엔드 | ✅ 완료 |
| Phase 4 | 통합 및 배포 | ✅ 완료 |
| Phase 5 | 정식 스키마 마이그레이션 | ✅ 완료 |

---

## Phase 0 — 기반 설정 ✅ 완료

- [x] 프로젝트 디렉토리 구조 생성
- [x] 설계 문서 작성 (`docs/design/`, `docs/impl/`)
- [x] 목업 데이터 JSON 생성 (`data/` 폴더)
- [x] `src/similarity_agent/loaders.py` 초기 구현
- [x] 프로토타입 HTML (`src/index.html`, `src/dashboard.html`)

---

## Phase 1 — 백엔드 코어 ✅ 완료

### 1-A. 프로젝트 스캐폴딩 ✅

- [x] `src/backend/` 디렉토리 구조 생성
- [x] `src/backend/requirements.txt` (fastapi, uvicorn, anthropic, motor, pydantic)
- [x] `src/backend/main.py` — FastAPI 앱 진입점, CORS 설정
- [x] `src/backend/config.py` — 환경변수 로드 (ANTHROPIC_API_KEY, MONGODB_URI)
- [x] `.env.example`

### 1-B. 데이터 계층 ✅

- [x] `src/backend/db/loaders.py` — JSON 기반 데이터 로더 (모든 카테고리)
  - [x] `load_market_data(country_id)`
  - [x] `load_customer_segment(country_id)`
  - [x] `load_purchase_process(country_id)`
  - [x] `load_regulation_data(country_id)` + `load_license_data(country_id)`
  - [x] `load_baseline()` / `load_baseline_for(country_name)`
- [x] `src/backend/db/models.py` — Pydantic 모델 정의
- [x] `src/backend/db/seed.py` — JSON → MongoDB 시딩 스크립트 (drop & reload / append 모드)

### 1-C. 유사도 엔진 ✅

- [x] `src/backend/core/similarity_engine.py`
  - [x] `score_item()` — CONTINUOUS / CATEGORICAL / BINARY / REFERENCE
  - [x] `calculate_category_score()` — null 마스킹, coverage 계산
  - [x] `calculate_total()` — 킬스위치·게이트·판정 로직
- [x] `src/backend/core/source_verifier.py` — 도메인 화이트리스트
- [x] `src/backend/core/normalizer.py` — 단위·통화 정규화
- [x] `src/backend/core/scoring.py` — 가중치·킬스위치·게이트 적용 + 비용 추정

### 1-D. WebSocket 진행률 ✅

- [x] `src/backend/ws/progress.py` — `broadcast_progress()`, `ConnectionManager`

### 1-E. API 라우터 ✅

- [x] `src/backend/routers/countries.py` — `GET /countries`, `GET /countries/{id}`
- [x] `src/backend/routers/settings.py` — 가중치 룰셋 CRUD + 잠금
- [x] `src/backend/routers/analysis.py` — `POST /analysis/run`, `GET /analysis/{id}`, `GET /analysis/{id}/status`
- [x] `src/backend/routers/reports.py` — `GET /reports/{id}`, `GET /reports`

---

## Phase 2 — 에이전트 구현 ✅ 완료

### 2-A. 에이전트 베이스 ✅

- [x] `src/backend/agents/base.py` — `BaseAgent`, `AgentResult`, `ItemScore`, `KillswitchResult` 데이터클래스

### 2-B. Phase 1 에이전트 (병렬 4개) ✅

- [x] `src/backend/agents/market.py` — `MarketAgent`
  - [x] 직접 로더 호출 + Haiku 근거 문장 생성
  - [x] `SimilarityEngine.score_item()` 위임
- [x] `src/backend/agents/regulation.py` — `RegulationAgent`
  - [x] 킬스위치 코드 처리 (LLM 아님)
  - [x] 조건부 규정 `human_review_flag` 처리
  - [x] `source_verifier` 출처 등급 검증
- [x] `src/backend/agents/environment.py` — `EnvironmentAgent`
- [x] `src/backend/agents/system.py` — `SystemAgent` + 시스템 게이트 플래그

### 2-C. Phase 2 에이전트 ✅

- [x] `src/backend/agents/summary.py` — `SummaryAgent`
  - [x] 종합 점수 / 킬스위치 / 게이트 검증 (코드)
  - [x] 비용 추정 (baseline × multiplier bands)
  - [x] Sonnet 4.6 — summary + ai_insight 보고서 텍스트 생성

### 2-D. 오케스트레이터 ✅

- [x] `src/backend/agents/orchestrator.py`
  - [x] `asyncio.gather()` Phase 1 병렬 실행
  - [x] WebSocket 진행률 스트리밍
  - [x] Phase 1 실패 처리 (2개 이상 핵심 실패 → FAILED)
  - [x] Phase 2 순차 실행

---

## Phase 3 — 프론트엔드 ✅ 완료

### 3-A. 프로젝트 초기화 ✅

- [x] Vite + React 18 + TypeScript 프로젝트 생성 (`src/frontend/`)
- [x] TailwindCSS 설정 (프로토타입 디자인 토큰 이식)
- [x] Zustand, axios, react-router-v6 설치
- [x] `src/frontend/src/store/analysisStore.ts` — 전역 분석 상태
- [x] `settingsStore.ts`, `uiStore.ts`
- [x] `tsconfig.app.json` `@/` 경로 별칭 설정
- [x] vite.config.ts 프록시 설정 (`/api` → 8000, `/ws` → 8000)

### 3-B. 공통 레이아웃 ✅

- [x] `AppShell.tsx` — 사이드 네비게이션 + 전체 레이아웃
- [x] `AnalysisStatusCard.tsx` — 우상단 고정, 축소/확장, 완료 후 10초 자동 축소
- [x] `AgentProgressBar.tsx` — 에이전트별 진행 바

### 3-C. S0 메인·대시보드 ✅

- [x] 국가 목록 카드 (진출 상태별 표시)
- [x] 최근 보고서 5건 목록
- [x] 바로 시작 버튼 (국가 진단 / 권역 순위)

### 3-D. S1 단일 국가 진단 ✅

- [x] 국가 선택 드롭다운 (대상국 / 기준국)
- [x] 분석 실행 → WebSocket 연결 (`useAnalysisWS`)
- [x] WebSocket 폴백 (5초 폴링)
- [x] `ScoreBreakdown.tsx`, `VerdictBadge.tsx`, `KillswitchWarning.tsx`, `CostEstimate.tsx`
- [x] 결과 패널 + 보고서 보기 버튼

### 3-E. S2 권역 순위 ✅

- [x] 권역 선택 UI + 분석 실행 버튼 (API 연동은 Phase 4)
- [x] 순위 테이블 (결과 대기 상태)

### 3-F. S3 설정 ✅

- [x] 카테고리 가중치 슬라이더 (합계 100% 검증)
- [x] 임계값 편집
- [x] 킬스위치 토글
- [x] 항상 새 룰셋 저장 + 잠금 기능

### 3-G. S4 보고서 ✅

- [x] `S4_Report/index.tsx` — 보고서 상세 (요약, AI 인사이트, 항목별 상세, 출처 tier)
- [x] `S4_Report/list.tsx` — 보고서 목록
- [x] 비교 불가 항목 마스킹 표시 ("비교 불가 — 데이터 미확보")
- [x] 빌드 검증 통과 (294KB JS, 15KB CSS)

---

## Phase 4 — 통합 및 배포 ✅ 완료

### 4-A. MongoDB 연동 ✅

- [x] `db/connection.py` — motor 기반 연결 싱글턴 (init_db/close_db, 3초 ping 타임아웃)
- [x] `db/loaders.py` — MongoDB + JSON 이중 모드 (MongoDB 미연결 시 자동 폴백)
  - [x] 룰셋·분석·결과 저장소 async 함수 추가
  - [x] (Phase 5에서 카테고리 로더는 `load_research_items`로 대체됨)
- [x] `main.py` lifespan 이벤트로 init_db/close_db 연결

### 4-B. 통합 테스트 ✅ — 52 tests, 52 passed

- [x] `tests/test_similarity_engine.py` — 유사도 엔진 단위 (17개)
  - [x] null ≠ 0 원칙 검증
  - [x] coverage 계산, 신뢰도 계수 적용
- [x] `tests/test_api_e2e.py` — API 엔드투엔드 (16개)
  - [x] countries / analysis / reports / settings 전 엔드포인트
  - [x] 룰셋 생성·잠금·수정 거부(409) 검증
- [x] `tests/test_websocket.py` — WebSocket + 폴링 폴백 (6개)
  - [x] 연결, progress/completed/error 메시지 수신
  - [x] 5초 폴링 엔드포인트 응답 구조 검증
- [x] `tests/test_agent_recovery.py` — 킬스위치·게이트·부분실패 (13개)
  - [x] 킬스위치 트리거 → BLOCKED (점수 무관)
  - [x] 시스템 게이트 실패 → DEEP_RESEARCH
  - [x] 에이전트 2개 이상 실패 → 중단 판정

### 4-C. 배포 ✅

- [x] `.env.example` 업데이트 (ANTHROPIC_API_KEY, MONGODB_URI, CORS_ORIGINS 등)
- [x] `src/backend/start.sh` — uvicorn 실행 스크립트
- [x] `deploy/nginx.conf` — 프론트 정적 파일 + API/WebSocket 프록시
- [x] `deploy/auto-finance.service` — systemd 서비스 유닛
- [x] 프론트엔드 프로덕션 빌드 확인 (294KB JS, 15KB CSS)
- [x] JSON 모드로 백엔드 기동 확인 (MongoDB 없이도 동작)

---

## Phase 5 — 정식 스키마 마이그레이션 (03_db_schema.md) ✅ 완료

> JSON 중첩 구조 직접 접근 → `catalog_item_id` 단위 정규화(`research_items`) 모델로 전환.
> 국가 식별자 ISO 전면 전환. MongoDB 8.0 로컬 적재까지 완료.

### 5-A. 카탈로그 + 변환기 ✅

- [x] `db/catalog_seed.py` — catalog_categories(4) + catalog_items(69, MKT/REG/FIN/SYS) + DEFAULT_RULESET
  - [x] 킬스위치 5개(REG_001~005)에 killswitch_rule(operator/threshold) 부여
- [x] `db/transformers.py` — JSON → research_items 변환
  - [x] COUNTRY_ISO_MAP(국가명↔ISO 양방향)
  - [x] attribute.key → catalog_item_id 매핑 (MARKET_ATTR_MAP 등)
  - [x] source_tier/confidence_grade 자동 산출 (source_verifier 재사용)
  - [x] KILLSWITCH_MOCKUP — 정의서 기반 킬스위치 목업 값 (TIER3 명시)
- [x] `db/models.py` — CatalogItem/CatalogCategory/ResearchItem/ResearchSnapshot/EntryRecord 추가

### 5-B. 로더·시드 ✅

- [x] `db/loaders.py` — `load_research_items`(ISO/한국어명 인터프리터, JSON 폴백 lru_cache),
      `load_catalog_*`, `load_entry_record`, `load_multiplier_table` 추가. 구 카테고리 로더 제거
- [x] `db/seed.py` — 정식 스키마 적재 (research_items 828건 / 12개국 snapshot)
- [x] `db/connection.py` — 정식 컬렉션 인덱스 추가

### 5-C. 에이전트 ✅ (catalog_item_id 기반 공통 패턴)

- [x] `agents/common.py` — collect_category_data / build_item_scores / generate_evidence 공유 헬퍼
- [x] market/environment/system/regulation 4개 재작성 (하드코딩 경로 제거)
- [x] `agents/regulation.py` — `check_killswitch` (룰 기반, **미확보→not blocked** 안전 분기)
- [x] `agents/summary.py` — load_entry_record + estimate_cost 어댑터 (prep_cost_usd 버그 해소)

### 5-D. ISO 전환 + 검증 ✅ — 82 tests, 82 passed

- [x] `routers/countries.py` — country_id(ISO) 반환, ISO/한국어명 조회
- [x] 프론트 `S1_Diagnosis`/`S0_Main`/`types/country.ts` — option value를 country_id로
- [x] `tests/test_transformers.py`(22) + `tests/test_agents_catalog_based.py`(16) 신규
- [x] 전체 82 테스트 JSON 모드 + MongoDB 모드 양쪽 통과
- [x] 레거시 컬렉션 6개 drop, 정식 스키마 10개 컬렉션만 잔존

---

## 블로커 / 이슈

| 날짜 | 항목 | 상태 |
|---|---|---|
| — | — | — |

---

## 메모

- `src/similarity_agent/loaders.py` 는 현재 `data/` JSON을 읽는 프로토타입 구현체. Phase 1-B에서 `src/backend/db/loaders.py`로 통합.
- 킬스위치·게이트 판정은 반드시 코드에서 처리 (LLM 프롬프트 금지).
- 룰셋 변경 시 새 버전 생성 — 기존 버전 덮어쓰기 금지.
