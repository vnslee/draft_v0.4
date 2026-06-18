# 에이전트 설계

> 버전 v0.1 · 작성일 2026-06-16
> 선행 문서: `docs/design/01_설계문서.md`, `docs/design/04_화면설계흐름.md` 4.5절,
>            `requirements/simillarity/agent_similarity_design.md`

---

## 1. 에이전트 구성 개요

```
Phase 1 (asyncio.gather — 병렬):
  MarketAgent      ─ Claude Haiku 4.5
  RegulationAgent  ─ Claude Haiku 4.5
  EnvironmentAgent ─ Claude Haiku 4.5
  SystemAgent      ─ Claude Haiku 4.5

Phase 2 (순차):
  SummaryAgent     ─ Claude Sonnet 4.6
```

**핵심 원칙**: LLM은 근거 문장과 인사이트 생성만. 유사도 점수 계산은 `SimilarityEngine`(코드)이 담당.

---

## 2. 공통 인터페이스

모든 Phase 1 에이전트는 아래 인터페이스를 구현한다.

```python
# src/backend/agents/base.py

class BaseAgent:
    """
    analyze() → AgentResult
    - LLM 호출로 데이터 수집 및 근거 문장 생성
    - 점수 계산은 SimilarityEngine에 위임
    - 진행률을 WebSocket으로 브로드캐스트
    """
    async def analyze(
        self,
        target_country_id: str,
        compared_country_id: str,
        snapshot_id: str,
        ruleset_id: str,
        ws_broadcaster: Callable
    ) -> AgentResult:
        raise NotImplementedError
```

```python
@dataclass
class AgentResult:
    category: str                   # "MARKET"|"REGULATORY"|"FINANCIAL"|"SYSTEM"
    items: list[ItemScore]
    category_score: float           # SimilarityEngine이 계산
    gate_passed: bool | None        # SYSTEM만 의미있음
    killswitch_results: list[KillswitchResult]  # REGULATORY만
    warnings: list[str]             # 데이터 갭, 공식 출처 미확보 등
    raw_data: dict                  # LLM이 추출한 원본 (디버그·감사용)

@dataclass
class ItemScore:
    catalog_item_id: str
    similarity: float               # 0.0~1.0
    confidence_grade: str
    source_tier: str
    evidence: str                   # LLM 생성 근거 문장
    is_missing: bool
```

---

## 3. Phase 1 에이전트 상세

### 3.1 MarketAgent

**담당**: 시장 카테고리 (가중치 25%)

**도구(Tool)**:
- `load_market_data(country_id)` — `data/auto_finance_market/` 로드
- `load_customer_segment(country_id)` — `data/customer_segment/` 로드
- `load_purchase_process(country_id)` — `data/purchase_process/` 로드

**분석 항목 (설계서 02 §1)**:
- 금융 침투율 신차/중고차 (연속)
- 오토금융 시장규모 (연속)
- 평균 차량가격 (연속)
- 구매 패턴 현금:할부:리스 (연속)
- 고객 세그먼트 개인:법인 비율 (연속)
- 딜러 유형 구조 (범주)

**Claude 호출 패턴**:
```python
# 1. tool_use로 데이터 로드
# 2. 로드된 데이터를 근거로 근거 문장 생성
# 3. SimilarityEngine.score_items() 호출 → 점수 산출

system_prompt = """
당신은 오토금융 시장 분석 전문가입니다.
주어진 두 국가의 시장 데이터를 비교하고, 각 항목에 대한 근거 문장을 한국어로 작성하세요.

규칙:
- 점수는 계산하지 않습니다. 근거 문장만 작성하세요.
- null 값은 "공식 데이터 미확보"로 명시하고, 추측하지 마세요.
- 출처가 TIER2·3인 항목은 "공식 출처 미확보" 표시를 반드시 포함하세요.
"""
```

---

### 3.2 RegulationAgent

**담당**: 규제 카테고리 (가중치 25%)

**도구(Tool)**:
- `load_regulation_data(country_id)` — `data/regulations/auto_finance_regulation.json`
- `load_license_data(country_id)` — `data/regulations/capital_license.json`
- `verify_source_domain(url)` — 도메인 화이트리스트 검증

**분석 항목 (설계서 02 §2) — 킬스위치 항목 포함**:
- 외국인 지분 한도 (**킬스위치**)
- 외환 송금 규제 (**킬스위치**)
- 배당 송금 제한 (**킬스위치**)
- 데이터 현지화 의무 (**킬스위치**)
- 금리 상한 (**킬스위치 + 연속**)
- 최저자본금 (연속)
- 인허가 처리기간 (연속)
- 법인세율 (연속)
- 차량회수 소요기간 (연속)

**킬스위치 처리**:
```python
# 킬스위치 판정은 LLM이 아닌 코드가 처리
killswitch_items = [i for i in catalog_items if i.is_killswitch and ruleset.killswitch_enabled(i)]
for item in killswitch_items:
    if not killswitch_rule_passes(item, target_value):
        result.killswitch_results.append(KillswitchResult(item_id=item.id, blocked=True))
```

**조건부 규정 처리**:
```python
# "원칙 49%, JV 시 100% 가능" 같은 조건부 규정
# → condition 필드에 분리 저장 + human_review_flag=True
# → 보고서에 "사람 검토 필요" 표시
```

---

### 3.3 EnvironmentAgent

**담당**: 금융환경 카테고리 (가중치 20%)

**도구(Tool)**:
- `load_regulation_data(country_id)` — 금리·LTV 데이터
- `load_market_data(country_id)` — 캡티브 강도

**분석 항목 (설계서 02 §3)**:
- 평균 금리 (연속 — 수익성 핵심)
- 평균 LTV (연속 — 손실 익스포저)
- 캡티브 강도 (연속 — 진입 난이도)
- 평균 대출기간 (연속)
- 캡티브/논캡티브 구분 (범주)
- 신용정보 CB 인프라 (범주)

---

### 3.4 SystemAgent

**담당**: 시스템 카테고리 (가중치 30%) + **시스템 게이트** 적용

**도구(Tool)**:
- `load_competitor_data(country_id)` — 경쟁사 시스템 정보
- `load_market_data(country_id)` — 디지털 채널 성숙도

**분석 항목 (설계서 02 §4)**:
- 주요 솔루션사 (범주)
- 솔루션 유형 패키지/SI/SaaS (범주)
- 코어시스템 벤더 락인 (범주 — **연동비용 직결**)
- 디지털 채널 성숙도 (범주)
- 결제·정산 인프라 (범주)

**시스템 게이트**:
```python
# SystemAgent 완료 후 SummaryAgent에서 검증
# system_category_score < system_gate_threshold → verdict = "DEEP_RESEARCH"
# (종합 점수와 무관)
```

---

## 4. Phase 2 — SummaryAgent

**모델**: Claude Sonnet 4.6 (보고서 품질 우선)

**입력**: Phase 1의 4개 `AgentResult`

**처리 순서**:

```python
async def synthesize(self, phase1_results: list[AgentResult]) -> SummaryResult:
    # 1. 유사도 엔진으로 종합 점수 계산 (코드)
    total_score = similarity_engine.calculate_total(phase1_results, ruleset)

    # 2. 킬스위치 검증 (코드)
    killswitch_hits = [r for r in phase1_results if r.killswitch_results]

    # 3. 시스템 게이트 검증 (코드)
    system_result = next(r for r in phase1_results if r.category == "SYSTEM")

    # 4. 판정 (코드)
    verdict = determine_verdict(total_score, killswitch_hits, system_result, ruleset)

    # 5. 비용 추정 (코드)
    cost = estimate_cost(total_score, compared_entry_record, ruleset)

    # 6. 보고서 텍스트 생성 (Claude Sonnet 4.6)
    summary, ai_insight = await self._generate_report_text(
        phase1_results, total_score, verdict, cost
    )

    return SummaryResult(...)
```

**보고서 텍스트 생성 프롬프트**:
```python
system_prompt = """
당신은 오토금융 해외진출 전략 컨설턴트입니다.
분석 결과를 바탕으로 의사결정자를 위한 보고서를 작성하세요.

작성 지침:
- summary: 3~5문장. 판정 근거와 핵심 리스크를 포함.
- ai_insight: 카테고리별 강약점 + 진출 전략 제언 (항목 형식, 200자 이내).
- 수치는 반드시 출처와 함께 인용하세요.
- 킬스위치 항목이 있으면 최우선으로 언급하세요.
- 데이터 미확보 항목은 "데이터 미확보"로 명시하고, 추측하지 마세요.
"""
```

---

## 5. 유사도 엔진 (`core/similarity_engine.py`)

에이전트와 분리된 순수 계산 모듈. LLM 없음, 결정적(재현 가능).

### 5.1 항목 유사도 (1층)

설계서 §4.1의 4축 모델 구현:

```python
def score_item(
    target_value: ItemValue,
    baseline_value: ItemValue,
    similarity_type: str,     # CONTINUOUS | CATEGORICAL | BINARY | REFERENCE
    confidence_grade: str
) -> float:

    if similarity_type == "CONTINUOUS":
        # 수치 거리 → 유사도
        # null 한쪽이면 N/A (마스킹)
        if target_value.is_missing or baseline_value.is_missing:
            return None  # 분모 제외
        normalized = normalize(target_value, baseline_value)
        return 1 - abs(normalized.a - normalized.b) / max(normalized.a, normalized.b)

    elif similarity_type == "CATEGORICAL":
        return 1.0 if target_value.code == baseline_value.code else 0.0

    elif similarity_type == "BINARY":
        # 킬스위치 판정 별도 처리
        return 1.0 if target_value.passes_rule() else 0.0

    elif similarity_type == "REFERENCE":
        return None  # 점수에 반영 안 함, 보고서용

    # 신뢰도 계수 적용
    score *= confidence_coef[confidence_grade]
    return score
```

### 5.2 카테고리 점수 (2층)

```python
def calculate_category_score(item_scores, category_weight_items, ruleset):
    valid = [(s, w) for s, w in zip(item_scores, weights) if s is not None]
    if not valid:
        return 0.0, 0.0  # score, coverage
    total_weight = sum(w for _, w in valid)
    score = sum(s * w for s, w in valid) / total_weight
    coverage = len(valid) / len(item_scores)
    return score * 100, coverage
```

### 5.3 종합 점수 (3층) + 게이트 + 킬스위치

```python
def calculate_total(category_scores, ruleset):
    # 킬스위치 우선
    if any_killswitch_hit:
        return ScoringResult(verdict="BLOCKED", total=0)

    # 시스템 게이트
    system_score = category_scores["SYSTEM"].weighted_score
    if system_score < ruleset.thresholds["system_gate"]:
        return ScoringResult(verdict="DEEP_RESEARCH", ...)

    # 종합 점수
    total = sum(cs.weighted_score for cs in category_scores.values())

    verdict = "TRANSPLANTABLE" if total >= ruleset.thresholds["entry"] else "DEEP_RESEARCH"
    return ScoringResult(verdict=verdict, total=total)
```

---

## 6. 출처 검증기 (`core/source_verifier.py`)

**LLM 프롬프트에 맡기지 않음.** 코드 레벨 도메인 화이트리스트.

```python
TIER1_DOMAINS = {
    "IN": ["rbi.org.in", "sebi.gov.in", "mca.gov.in", "indiacode.nic.in"],
    "KR": ["fsc.go.kr", "bok.or.kr", "law.go.kr"],
    "DE": ["bafin.de", "bundesbank.de", "gesetze-im-internet.de"],
    "US": ["federalreserve.gov", "sec.gov", "consumerfinance.gov"],
    # ...
}

BLOCKED_PATTERNS = [
    r"wikipedia\.org", r".*\.blogspot\.com", r".*\.wordpress\.com",
    r"reddit\.com", r"quora\.com"
]

def verify_source(url: str, country_id: str) -> SourceTier:
    if matches_blocked(url):
        return SourceTier.BLOCKED
    if domain_in_whitelist(url, TIER1_DOMAINS.get(country_id, [])):
        return SourceTier.TIER1
    if domain_in_whitelist(url, TIER2_DOMAINS):
        return SourceTier.TIER2
    return SourceTier.TIER3
```

---

## 7. 진행률 브로드캐스트

```python
# src/backend/ws/progress.py

async def broadcast_progress(
    analysis_id: str,
    agent: str,
    progress: int,
    status: str,
    message: str
):
    payload = {
        "type": "progress",
        "agent": agent,
        "progress": progress,
        "status": status,
        "message": message
    }
    await ws_manager.broadcast(analysis_id, payload)
    # MongoDB analysis_jobs 업데이트 (폴링 폴백용)
    await update_job_progress(analysis_id, agent, progress, status)
```

각 에이전트는 처리 단계마다 `broadcast_progress()`를 호출:
- 데이터 로드 시작: 0%
- 데이터 로드 완료: 30%
- LLM 근거 생성 시작: 40%
- LLM 근거 생성 완료: 80%
- 점수 계산 완료: 100%

---

## 8. Claude API 호출 패턴

```python
# anthropic SDK 사용
import anthropic

client = anthropic.AsyncAnthropic()

# Phase 1: Haiku — 병렬 4개
async def call_haiku(system: str, messages: list) -> str:
    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=system,
        messages=messages
    )
    return response.content[0].text

# Phase 2: Sonnet — Summary
async def call_sonnet(system: str, messages: list) -> str:
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=system,
        messages=messages
    )
    return response.content[0].text
```

**tool_use 패턴** (에이전트가 데이터 로드 도구 호출 시):
```python
tools = [
    {
        "name": "load_market_data",
        "description": "국가의 오토금융 시장 데이터를 로드합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "country_id": { "type": "string", "description": "ISO 국가 코드" }
            },
            "required": ["country_id"]
        }
    }
]
```

---

## 9. 에러 처리 전략

| 상황 | 처리 |
|---|---|
| Phase 1 단일 에이전트 실패 | 해당 카테고리 score=0, coverage=0, warning 추가. 나머지 계속 진행. |
| Phase 1 2개 이상 실패 | 분석 중단. verdict="FAILED". 재시도 버튼 노출. |
| Claude API 오류 | 3회 지수 백오프 재시도. 실패 시 해당 에이전트 실패 처리. |
| 킬스위치 데이터 미확보 | `human_review_flag=True` 설정. 자동 판정 보류. |
| Summary 에이전트 실패 | 전체 실패. "보고서 생성 실패" + 재시도. |
