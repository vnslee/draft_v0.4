# 배포 및 개발환경 가이드

> 버전 v0.1 · 작성일 2026-06-16

---

## 1. 로컬 개발 환경

### 필수 조건

| 항목 | 버전 |
|---|---|
| Python | 3.11+ |
| Node.js | 20+ |
| MongoDB | 7.x (Docker 권장) |
| ANTHROPIC_API_KEY | Claude API 키 |

---

### 1.1 MongoDB 기동 (Docker)

```bash
docker run -d \
  --name mongo-auto-finance \
  -p 27017:27017 \
  -v mongo_data:/data/db \
  mongo:7
```

---

### 1.2 백엔드 실행

```bash
cd src/backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

pip install -r requirements.txt

# 환경 변수
cp .env.example .env
# .env 편집: ANTHROPIC_API_KEY, MONGODB_URI

# DB 시드 데이터 적재
python scripts/seed_db.py

# 서버 실행 (포트 8000)
uvicorn main:app --reload --port 8000
```

---

### 1.3 프론트엔드 실행

```bash
cd src/frontend
npm install

# 환경 변수
cp .env.example .env
# .env 편집: VITE_API_BASE_URL, VITE_WS_BASE_URL

# 개발 서버 실행 (포트 5173)
npm run dev
```

브라우저: `http://localhost:5173`

---

### 1.4 디렉토리 초기 세팅 구조

```
src/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── analysis.py
│   │   ├── countries.py
│   │   ├── reports.py
│   │   └── settings.py
│   ├── agents/
│   │   ├── base.py
│   │   ├── orchestrator.py
│   │   ├── market.py
│   │   ├── regulation.py
│   │   ├── environment.py
│   │   ├── system.py
│   │   └── summary.py
│   ├── core/
│   │   ├── similarity_engine.py
│   │   ├── source_verifier.py
│   │   ├── normalizer.py
│   │   └── scoring.py
│   ├── db/
│   │   ├── connection.py
│   │   ├── models.py
│   │   └── loaders.py          ← 이 파일만 수정하면 JSON↔MongoDB 전환
│   ├── ws/
│   │   └── progress.py
│   └── scripts/
│       └── seed_db.py
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── .env.example
    └── src/
        └── (05_frontend_spec.md 구조 참조)
```

---

## 2. 의존성 목록

### 2.1 백엔드 `requirements.txt`

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
anthropic==0.40.0         # Claude API SDK
motor==3.5.0              # MongoDB async driver
pydantic==2.8.0
pydantic-settings==2.4.0
python-dotenv==1.0.0
httpx==0.27.0             # 비동기 HTTP
pytest==8.3.0
pytest-asyncio==0.24.0
```

### 2.2 프론트엔드 `package.json` 주요 의존성

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.0",
    "axios": "^1.7.0",
    "react-simple-maps": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## 3. 환경 변수 정의

### 백엔드 `.env`

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# MongoDB
MONGODB_URI=mongodb://localhost:27017/auto_finance   # 로컬
# MONGODB_URI=mongodb+srv://...                      # Atlas
DB_NAME=auto_finance

# 앱 설정
CORS_ORIGINS=http://localhost:5173
MAX_CONCURRENT_ANALYSES=3     # 동시 분석 허용 수
WS_HEARTBEAT_INTERVAL=30      # 초

# Claude API 폴백 (API 키 없으면 목업 모드)
ENABLE_LLM_FALLBACK=true
```

### 프론트엔드 `.env`

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_BASE_URL=ws://localhost:8000/ws
```

---

## 4. 데이터 흐름 — JSON → MongoDB 전환

현재 `loaders.py`는 `data/` 폴더 JSON을 읽는다.
MongoDB 전환 시 `src/backend/db/loaders.py`의 함수 본문만 교체.
함수 시그니처(반환 타입 포함)는 절대 변경하지 않는다.

```python
# 전환 전 (JSON 모드)
async def load_countries() -> dict[str, Country]:
    with open(DATA_DIR / "countries/countries.json") as f:
        raw = json.load(f)
    return {c["name"]: Country(**c) for c in raw["countries"]}

# 전환 후 (MongoDB 모드)
async def load_countries() -> dict[str, Country]:
    docs = await db.countries.find({}).to_list(None)
    return {d["name"]: Country(**d) for d in docs}
```

---

## 5. 개발 순서 (권장)

```
1단계: 백엔드 기초
  - FastAPI 앱 + MongoDB 연결 + 시드 데이터 적재
  - GET /countries, GET /settings/rulesets 구현

2단계: 유사도 엔진
  - SimilarityEngine 구현 (JSON 데이터 기반)
  - 기존 similarity_agent/loaders.py 통합

3단계: 에이전트
  - BaseAgent → MarketAgent 구현 (Haiku 호출 포함)
  - Phase 1 나머지 3개 에이전트
  - Phase 2 SummaryAgent

4단계: API + WebSocket
  - POST /analysis/run + WebSocket 진행률 브로드캐스트
  - GET /reports/{id}

5단계: 프론트엔드
  - AppShell + 라우팅 + AnalysisStatusCard (Zustand)
  - S0 (세계 지도) → S1 (진단 실행) → S4 (보고서)
  - S2, S3, S5 순

6단계: MongoDB 전환
  - loaders.py → motor 기반으로 교체
  - 인덱스 + TTL 설정
```

---

## 6. CORS 설정

```python
# src/backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,   # ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
