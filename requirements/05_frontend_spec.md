# 프론트엔드 명세

> 버전 v0.1 · 작성일 2026-06-16
> 선행 문서: `docs/design/04_화면설계흐름.md`, `docs/design/화면요구사항명세서.md`

---

## 1. 기술 스택

| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | React 18 + Vite | 빠른 빌드, TypeScript 기본 지원 |
| 언어 | TypeScript | 타입 안전성 (분석 상태 복잡도 때문에 필수) |
| 상태 관리 | Zustand | 전역 분석 상태 (AnalysisStatusCard가 전 화면에서 접근) |
| 스타일 | TailwindCSS | 기존 프로토타입 색상 시스템 유지 가능 |
| HTTP 클라이언트 | axios | 인터셉터로 에러 처리 통일 |
| WebSocket | 브라우저 네이티브 `WebSocket` + 커스텀 훅 | 의존성 최소화 |
| 라우터 | React Router v6 | S0~S5 라우트 |
| SVG 세계 지도 | `react-simple-maps` 또는 커스텀 SVG | 기존 프로토타입 SVG 지도 활용 |

---

## 2. 프로젝트 구조

```
src/frontend/
├── src/
│   ├── pages/
│   │   ├── S0_Main/          # 메인·대시보드
│   │   ├── S1_Diagnosis/     # 단일 국가 진단
│   │   ├── S2_Ranking/       # 권역 순위
│   │   ├── S3_Settings/      # 가중치·설정
│   │   ├── S4_Report/        # 보고서 뷰어
│   │   └── S5_DataManager/   # 데이터 관리
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx           # 전체 레이아웃 + 상단 바
│   │   │   └── AnalysisStatusCard.tsx # 전 화면 공통 분석 상태 카드
│   │   │
│   │   ├── analysis/
│   │   │   ├── AnalysisDetailModal.tsx  # 에이전트별 진행률 팝업
│   │   │   ├── AgentProgressBar.tsx     # 에이전트 단위 진행 바
│   │   │   └── ViewReportButton.tsx     # 완료 시 활성화
│   │   │
│   │   ├── map/
│   │   │   ├── WorldMap.tsx           # SVG 인터랙티브 세계 지도
│   │   │   └── CountryDetailCard.tsx  # 지도 클릭 시 우측 카드
│   │   │
│   │   ├── results/
│   │   │   ├── ScoreBreakdown.tsx     # 카테고리별 점수 분해
│   │   │   ├── VerdictBadge.tsx       # 판정 배지 (이식가능/심층조사/차단)
│   │   │   ├── KillswitchWarning.tsx  # 킬스위치 경고 (최상단 표시)
│   │   │   └── CostEstimate.tsx       # 비용 추정 표시
│   │   │
│   │   ├── report/
│   │   │   ├── ReportViewer.tsx       # 보고서 전체 렌더
│   │   │   ├── SourceList.tsx         # 출처 목록 (tier 표시)
│   │   │   └── WeightSnapshot.tsx     # 가중치 스냅샷 표시
│   │   │
│   │   └── settings/
│   │       ├── WeightEditor.tsx       # 카테고리·항목 가중치 슬라이더
│   │       ├── ThresholdEditor.tsx    # 임계값 편집
│   │       └── KillswitchToggle.tsx   # 킬스위치 on/off
│   │
│   ├── store/
│   │   ├── analysisStore.ts    # 분석 진행 상태 (Zustand)
│   │   ├── settingsStore.ts    # 현재 룰셋
│   │   └── uiStore.ts          # 모달 열림 등 UI 상태
│   │
│   ├── hooks/
│   │   ├── useAnalysisWS.ts    # WebSocket 연결·메시지 처리
│   │   ├── useAnalysis.ts      # 분석 실행·취소
│   │   └── useCountries.ts     # 국가 데이터
│   │
│   ├── api/
│   │   ├── client.ts           # axios 인스턴스
│   │   ├── analysis.ts
│   │   ├── countries.ts
│   │   ├── reports.ts
│   │   └── settings.ts
│   │
│   └── types/
│       ├── analysis.ts
│       ├── country.ts
│       ├── report.ts
│       └── settings.ts
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. 전역 상태 설계 (Zustand)

### `analysisStore.ts`

```typescript
interface AnalysisState {
  // 현재 진행 중인 분석
  isRunning: boolean;
  analysisId: string | null;
  mode: 'single' | 'region' | null;
  targetCountry: Country | null;
  targetRegion: string | null;
  overallProgress: number;           // 0–100 (정수)
  agents: {
    market:      AgentStatus;
    regulation:  AgentStatus;
    environment: AgentStatus;
    system:      AgentStatus;
    summary:     AgentStatus;
  };
  startedAt: Date | null;
  resultId: string | null;           // 완료 시 채워짐

  // Actions
  startAnalysis: (target: Country | string, mode: 'single' | 'region') => void;
  updateAgentProgress: (agent: AgentName, update: Partial<AgentStatus>) => void;
  completeAnalysis: (resultId: string) => void;
  cancelAnalysis: () => void;
  resetAnalysis: () => void;
}

interface AgentStatus {
  progress: number;                  // 0–100 (정수)
  status: 'waiting' | 'running' | 'completed' | 'error';
  message: string;
}
```

---

## 4. 화면별 명세

### 4.1 S0 — 메인 / 대시보드

| 영역 | 컴포넌트 | 데이터 |
|---|---|---|
| 인터랙티브 세계 지도 | `WorldMap` | `GET /countries` — 진출 상태별 색상 |
| 국가 상세 카드 | `CountryDetailCard` | 지도 클릭 시 해당 국가 최근 분석 결과 |
| 기능 진입 버튼 | — | "국가 진단" → S1, "권역 순위" → S2 |
| 최근 보고서 목록 | — | `GET /reports?limit=5` |
| 분석 상태 카드 | `AnalysisStatusCard` | analysisStore |

**세계 지도 색상**:
```
진출국:       #1a1a1a (검정)
이식가능:     #16a34a (초록)
심층조사:     #ca8a04 (황색)
차단(킬스위치): #dc2626 (적색)
미조사:       #6b7280 (회색)
```

---

### 4.2 S1 — 단일 국가 진단

| 영역 | 설명 |
|---|---|
| 국가 선택 | 드롭다운 (13개국, 지도에서 선택한 국가 자동 설정) |
| 룰셋 선택 칩 | 현재 룰셋 이름 + 변경 링크 → S3 |
| 분석 실행 버튼 | 클릭 → `POST /analysis/run` → WebSocket 연결 |
| 분석 진행 카드 | `AnalysisStatusCard` (상단 우측, 전 화면 공통) |
| 결과 패널 | 완료 후 표시: 종합 점수, 판정, 카테고리 분해, 비용 추정 |
| 킬스위치 경고 | `KillswitchWarning` — BLOCKED 판정이면 결과 최상단에 |
| 보고서 보기 버튼 | Summary 100% 완료 시에만 활성화 |

**데이터 동기화 원칙** (설계서 §3.2):
- analysisStore의 `targetCountry`가 모든 UI의 단일 진실 소스
- 하드코딩된 국가 데이터 사용 금지

---

### 4.3 S2 — 권역 순위

| 영역 | 설명 |
|---|---|
| 권역 선택 | APAC / EUROPE / AMERICAS |
| 분석 실행 | `POST /analysis/run { mode: "region", target_region: "APAC" }` |
| 분석 진행 카드 | `AnalysisStatusCard` — "APAC 권역 분석 중 (3/7 국가 완료)" |
| 순위표 | 완료 후 표시: 순위, 국가, 종합 점수, 카테고리 분해, 판정 |
| 드릴다운 | 순위표 행 클릭 → S1 (해당 국가 결과) 또는 S4 |

---

### 4.4 S3 — 설정

| 영역 | 설명 |
|---|---|
| 현재 룰셋 표시 | 이름, 생성일, 잠금 여부 |
| 카테고리 가중치 | 4개 슬라이더 (합계 100% 강제) |
| 항목별 가중치 | 카테고리 내 항목 가중치 편집 |
| 임계값 | 진입 임계값(70), 시스템 게이트(50) 편집 |
| 킬스위치 | 항목별 on/off 토글 + 기준값 |
| 저장 | 항상 새 룰셋으로 저장 (기존 수정 금지) |
| "저장 후 재분석" | 직전 분석 대상으로 재실행 |

---

### 4.5 S4 — 보고서 뷰어

| 섹션 | 내용 |
|---|---|
| 헤더 | 국가명, 분석일, 종합 점수, 판정 배지 |
| 요약 | `summary` 텍스트 |
| AI 인사이트 | `ai_insight` 텍스트 |
| 카테고리별 상세 | 항목·값·유사도·출처 tier 테이블 |
| 출처 목록 | `SourceList` — TIER1/2/3 구분, 공식출처갭 플래그 |
| 가중치 스냅샷 | 보고서 생성 시점 룰셋 표시 |
| 조사일자 | 대상국 조사일 vs 기준국 스냅샷 시점 격차 |
| 액션 | "이 보고서 가중치로 재실행" → S3, "원본 분석으로" → S1/S2 |

---

### 4.6 S5 — 데이터 관리

| 영역 | 설명 |
|---|---|
| 진출국 실적 | ENTRY_RECORD CRUD (진출 비용·기간·시스템 정보) |
| 조사 데이터 | 국가별 RESEARCH_SNAPSHOT 목록 + 새 회차 입력 |
| 갱신 이력 | 회차별 조사일자·상태·담당자 |
| "이 국가 진단하기" | 조사 완료 직후 S1으로 이동 |

---

## 5. `AnalysisStatusCard` — 전 화면 공통 컴포넌트

`AppShell.tsx` 최상위에 마운트. `analysisStore`를 구독.

```
isRunning=false → 렌더링 없음
isRunning=true  → 상단 우측 고정 표시

[축소 상태]
┌──────────────────────────────┐
│ 🇮🇳 인도 분석 중              │
│ ████████░░░░ 65%  [상세보기] │
└──────────────────────────────┘

[확장 상태]
┌──────────────────────────────────┐
│ 🇮🇳 인도 분석 중            [×] │
│ ████████░░░░ 65%                │
│ ✓ 시장: 완료                    │
│ ⏳ 규제: 75%                    │
│ ⏳ 환경: 40%                    │
│ ⏳ 시스템: 90%                  │
│ ⏸ Summary: 대기 중             │
│      [상세 팝업 열기]           │
└──────────────────────────────────┘
```

완료 10초 후 자동 축소. 아이콘: 진행중=🔄, 완료=✓, 대기=⏸, 오류=⚠️.

---

## 6. `useAnalysisWS` — WebSocket 훅

```typescript
function useAnalysisWS(analysisId: string | null) {
  const updateAgentProgress = useAnalysisStore(s => s.updateAgentProgress);
  const completeAnalysis = useAnalysisStore(s => s.completeAnalysis);

  useEffect(() => {
    if (!analysisId) return;
    const ws = new WebSocket(`ws://localhost:8000/ws/analysis/${analysisId}`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'progress') {
        updateAgentProgress(msg.agent, {
          progress: Math.round(msg.progress),  // 정수 강제
          status: msg.status,
          message: msg.message
        });
      } else if (msg.type === 'completed') {
        completeAnalysis(msg.result_id);
      }
    };

    // 폴백: WebSocket 실패 시 5초 폴링
    ws.onerror = () => startPolling(analysisId);

    return () => ws.close();
  }, [analysisId]);
}
```

---

## 7. 색상 / 디자인 토큰

기존 프로토타입(`src/dashboard.html`) 색상 시스템 유지:

```typescript
// tailwind.config.ts 커스텀 컬러
colors: {
  'status-running':   '#0d9488',  // teal-green
  'status-completed': '#16a34a',  // green
  'status-waiting':   '#6b7280',  // gray
  'status-error':     '#dc2626',  // red
  'verdict-ok':       '#16a34a',
  'verdict-deep':     '#ca8a04',
  'verdict-blocked':  '#dc2626',
}
```

---

## 8. 환경 변수

```
# .env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_BASE_URL=ws://localhost:8000/ws
```
