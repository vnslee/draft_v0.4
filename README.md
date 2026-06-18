<<<<<<< HEAD
# draft_v0.4
초안 버전 4
=======
# 오토파이낸스 해외진출 진단 에이전트

한국 캐피탈사의 신규 국가 진출 의사결정 지원 도구. 진출국(베이스) 실적을 기준으로 미진출국의 진출 난이도·비용을 유사도 기반으로 추정한다.

현재 영국(베이스)·폴란드(예상 진출국) 2개국 데이터로 동작한다. 영국 기준 폴란드 종합 유사도 **63.5점 / 심층조사 권고**.

## 폴더 구조

```
data/        나라별 데이터 + 공용 마스터
├─ index.json            나라 목록 + 가중치·임계값 설정
├─ GB.json               영국 (베이스)
├─ PL.json               폴란드 (예상 진출국)
├─ catalog_items.json    69항목 마스터 (공용)
└─ semantic_matrix.json  코드값 의미 유사도 (공용)

engine/      유사도 엔진
├─ similarity.js         항목→카테고리→종합 점수, 게이트·킬스위치·비용추정
└─ semantic_matrix.js    범주형 코드값 유사도 (JS 버전)

reports/     보고서 생성
├─ src/        코드
│  ├─ render_report.js          정의 JSON + 데이터 → HTML (Node용)
│  └─ charts.js                 SVG 차트 라이브러리
├─ templates/  구성 정의·셸
│  ├─ report_def_executive.json 경영진용 구성 정의
│  ├─ report_def_detailed.json  실무용 구성 정의
│  └─ report_shell.html         공용 HTML 셸
└─ output/     생성 결과
   ├─ 폴란드_경영진보고서.html    경영진용
   └─ 폴란드_상세보고서.html      실무용

design/      설계 문서
└─ 01_설계문서.md ~ 06_점수계산_상세산식.md

research/     국가 조사 문서
├─ 07_폴란드_상세조사.md / 08_영국_상세조사.md
└─ 국가조사_프롬프트.md       새 나라 조사용 재사용 프롬프트

prototype/   대시보드 프로토타입 (목업)
└─ 오토금융진출진단_프로토타입.html

README_통합가이드.md   대시보드 연결 방법 (데이터 읽기·엔진 호출·화면별 연결)
```

## 데이터 흐름

```
조사 → data/{국가}.json (정규화)
        ↓ engine/similarity.js + engine/semantic_matrix.js
       점수·판정 (종합·카테고리·게이트·킬스위치)
        ↓ reports/src/render_report.js + templates/report_def_*.json + src/charts.js
       reports/output/ HTML 보고서 (경영진용 / 실무용)
```

## 빠른 시작

```bash
# 엔진 단독 실행 (Node) — 어느 경로에서 실행해도 동작
node engine/similarity.js   # 영국 기준 폴란드 진단 출력

# 보고서 생성 (Node)
node reports/src/render_report.js reports/templates/report_def_executive.json reports/output/out.html
```

대시보드 연결은 `README_통합가이드.md` 참조. 로컬 실행 시 `file://` 더블클릭은 CORS에 막히므로 로컬 서버(`python3 -m http.server`)로 띄울 것.

## 핵심 설계 원칙

1. **점수는 규칙, 근거는 데이터** — 유사도 점수는 엔진이 결정적으로 산출.
2. **출처 등급제** — Tier1(공식 1차)/Tier2(준공식)/Tier3(참고). 신뢰도 계수로 자동 감점.
3. **null ≠ 0** — 미확보 데이터는 점수에서 제외(공백 처리), 0점 아님.
4. **시스템 게이트** — 시스템 유사도 50 미만이면 이식 불가 판정.
5. **킬스위치** — 외국인지분·금리상한·외환/배당송금·데이터현지화 5개 중 하나라도 막히면 BLOCKED.

## 다음 단계

- 나머지 국가(미국·호주·스페인·뉴질랜드·인도) `data/{코드}.json` 작성 → `index.json`에 추가하면 자동 반영
- `render_report.js`를 브라우저용으로 변환(파일 읽기 → fetch)
- 프로토타입 버튼에 실제 엔진 연결
>>>>>>> c71e864 (Update README.md)
