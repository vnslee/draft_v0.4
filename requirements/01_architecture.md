# 시스템 아키텍처

> 버전 v0.1 · 작성일 2026-06-16
> 선행 문서: `docs/design/01_설계문서.md` 3장, `docs/design/04_화면설계흐름.md` 4.5절

---

## 1. 전체 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React + Vite)                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │  S0    │ │  S1    │ │  S2    │ │  S3    │ │  S4/S5 │        │
│  │ 메인   │ │단일진단│ │권역순위│ │ 설정   │ │보고서  │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
│       │          │                                              │
│  HTTP REST    WebSocket /ws/analysis/{id}                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│  FastAPI Backend (포트 8000)                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │  API Router                                     │           │
│  │  POST /analysis/run   GET /analysis/{id}        │           │
│  │  GET  /countries      GET /reports/{id}         │           │
│  │  CRUD /settings/rulesets                        │           │
│  └──────────────────┬──────────────────────────────┘           │
│                     │                                           │
│  ┌──────────────────▼──────────────────────────────┐           │
│  │  Agent Orchestrator                             │           │
│  │                                                 │           │
│  │  asyncio.gather ─┬─ MarketAgent                │           │
│  │  (Phase 1)       ├─ RegulationAgent             │           │
│  │                  ├─ EnvironmentAgent             │           │
│  │                  └─ SystemAgent                 │           │
│  │                        │                        │           │
│  │  SummaryAgent ─────────┘  (Phase 2)            │           │
│  │  └─ Claude Sonnet 4.6                           │           │
│  └──────────────────┬──────────────────────────────┘           │
│                     │                                           │
│  ┌──────────────────▼──────────────────────────────┐           │
│  │  Core Services                                  │           │
│  │  ┌─────────────┐  ┌─────────────┐               │           │
│  │  │ SimilarityEngine │ │SourceVerifier│           │           │
│  │  │ (규칙 기반) │  │(도메인 화이트│           │           │
│  │  └─────────────┘  │  리스트)    │           │           │
│  │                   └─────────────┘               │           │
│  └──────────────────┬──────────────────────────────┘           │
│                     │                                           │
│  ┌──────────────────▼──────────────────────────────┐           │
│  │  Data Layer (loaders.py)                        │           │
│  │  ┌──────────┐          ┌──────────┐             │           │
│  │  │ MongoDB  │  또는    │  JSON    │  ← 현재     │           │
│  │  │  Atlas   │          │  (data/) │             │           │
│  │  └──────────┘          └──────────┘             │           │
│  └─────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                       │
               ┌───────▼────────┐
               │  Claude API    │
               │  Haiku 4.5     │ ← Phase 1 에이전트 (4개 병렬)
               │  Sonnet 4.6    │ ← Phase 2 Summary + 보고서
               └────────────────┘
```

---

## 2. 컴포넌트 책임 정의

### 2.1 프론트엔드 (`src/frontend/`)

| 컴포넌트 | 책임 |
|---|---|
| `AnalysisStatusCard` | 상단 우측 분석 진행 카드 (전 화면 공통) |
| `AnalysisDetailModal` | 에이전트별 진행률 상세 팝업 |
| `WorldMap` | SVG 인터랙티브 세계 지도 (S0) |
| `ScoreBreakdown` | 카테고리별 점수 분해 표시 |
| `ReportViewer` | 보고서 렌더링 (S4) |
| `WeightEditor` | 가중치·임계값·킬스위치 설정 (S3) |
| `analysisStore` | Zustand — 분석 진행 상태 전역 관리 |

### 2.2 백엔드 (`src/backend/`)

| 모듈 | 책임 |
|---|---|
| `routers/analysis.py` | 분석 실행·조회 API |
| `routers/countries.py` | 국가 목록·상세 API |
| `routers/reports.py` | 보고서 CRUD |
| `routers/settings.py` | 가중치 룰셋 CRUD |
| `agents/orchestrator.py` | Phase 1/2 에이전트 오케스트레이션 |
| `agents/market.py` | 시장 분석 에이전트 |
| `agents/regulation.py` | 규제 분석 에이전트 |
| `agents/environment.py` | 금융환경 분석 에이전트 |
| `agents/system.py` | 시스템 분석 에이전트 |
| `agents/summary.py` | 통합 Summary 에이전트 |
| `core/similarity_engine.py` | 유사도 산출 (규칙 기반, LLM 없음) |
| `core/source_verifier.py` | 출처 도메인 화이트리스트 검증 |
| `core/normalizer.py` | 단위·통화 정규화 |
| `core/scoring.py` | 가중치·킬스위치·게이트 적용 |
| `db/loaders.py` | 데이터 접근 계층 (JSON ↔ MongoDB 전환점) |
| `db/models.py` | Pydantic + MongoDB 모델 |
| `ws/progress.py` | WebSocket 진행률 브로드캐스트 |

### 2.3 유사도 엔진 (`src/similarity_agent/`)

현재 MVP Python 구현. `loaders.py`는 `data/` 폴더를 읽는다.
MongoDB 전환 시 `loaders.py`의 함수 본문만 교체 — 시그니처 유지 필수.

---

## 3. 데이터 흐름 (단일 국가 진단)

```
사용자: "인도 분석 실행"
    │
    ▼
POST /analysis/run {target: "IN", ruleset_id: "default"}
    │
    ▼
orchestrator.run_analysis()
    ├── analysis_id 생성 → MongoDB 저장 (status: RUNNING)
    ├── WebSocket 채널 /ws/analysis/{id} 개방
    │
    ├── Phase 1: asyncio.gather(
    │       MarketAgent.analyze("IN") ─────┐
    │       RegulationAgent.analyze("IN") ─┤─ Claude Haiku 4.5
    │       EnvironmentAgent.analyze("IN")─┤─ 진행률 → WebSocket
    │       SystemAgent.analyze("IN") ─────┘
    │   )
    │
    └── Phase 2: SummaryAgent.synthesize(phase1_results)
            ├── 유사도 엔진 → 카테고리 점수
            ├── 킬스위치·게이트 검증
            ├── 최종 판정 (TRANSPLANTABLE / DEEP_RESEARCH / BLOCKED)
            ├── 비용 추정 (baseline × multiplier)
            └── Claude Sonnet 4.6 → 보고서 summary + ai_insight 생성
    │
    ▼
MongoDB 저장: SIMILARITY_RESULT + REPORT
WebSocket: {type: "completed", result_id: "..."}
    │
    ▼
프론트: "보고서 보기" 활성화 → GET /reports/{result_id}
```

---

## 4. 실시간 통신 (WebSocket)

### 4.1 메시지 포맷

```json
// 진행률 업데이트
{
  "type": "progress",
  "agent": "market" | "regulation" | "environment" | "system" | "summary",
  "progress": 0–100,
  "status": "running" | "completed" | "error",
  "message": "침투율 데이터 수집 중..."
}

// 완료
{
  "type": "completed",
  "result_id": "res_abc123",
  "verdict": "TRANSPLANTABLE",
  "total_score": 74
}

// 에러
{
  "type": "error",
  "agent": "regulation",
  "message": "규제 데이터 로드 실패",
  "recoverable": true
}
```

### 4.2 폴백
WebSocket 연결 실패 시 프론트는 5초 간격 `GET /analysis/{id}/status` 폴링으로 자동 전환.

---

## 5. 비기능 요구사항

| 항목 | 목표 |
|---|---|
| 단일 국가 분석 소요 시간 | 1~2분 (Phase 1: 30–60초 병렬, Phase 2: 10–20초) |
| 권역 분석 (7개국) | 2~3분 |
| 동시 분석 | 최대 3건 (Claude API rate limit 고려) |
| 보고서 재현성 | 동일 ruleset_id + snapshot → 동일 점수 보장 |
| 에이전트 부분 실패 | 단일 에이전트 실패 시 나머지 계속 진행, 부분 데이터로 Summary 처리 |
