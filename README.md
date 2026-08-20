# next:R.U.N.

**MCM의 잉여 소재로 다음 한정판 제품을 기획하는 AI 도구**

명지대학교 2종보통멋쟁이 팀 | [CND-FE](https://github.com/Caution-new-driver/CND-FE) · [CND-BE](https://github.com/Caution-new-driver/CND-BE) | [next-run.shop](https://www.next-run.shop/)

## 문제 정의

MCM의 RUN(Recycle, Upcycle, Network) 프로젝트는 지금까지 2만 1천 미터의 잉여 소재를 3만 5천 점의 제품으로 되살렸습니다. 다만 이 성과는 아티스트 협업이나 학교 워크숍을 통해 그때그때 만들어지는 일회성 컬렉션에 가깝고, 상시 판매 라인은 아닙니다.

상시 라인으로 전환하려면 소재가 들어올 때마다 "이 소재로 상품을 만들 수 있는가"를 빠르게 판단해야 합니다. 그런데 잉여 소재는 매번 크기·색상·패턴·잔여 수량이 달라, 담당자는 매번 처음부터 적합 소재 선별·제작 가능 수량 산정·잔여 자투리 활용 방안을 사람이 눈으로 대조하고 수기로 계산하고 있습니다.

## 핵심 기능

소재 등록 → Drop 기획 → 디자인 조건 입력 → 소재 추천 → 제작 결과 산출 → Drop 확정, 여섯 단계로 동작합니다.

- **소재 등록**: 사진을 올리면 AI(OpenAI 연동)가 색상·패턴·소재 종류를 신뢰도 점수와 함께 자동 태깅
- **소재 추천**: 디자인 조건을 입력하면 재고 전체에서 조건을 통과한 소재만 걸러 점수를 매겨 추천, AI는 추천 근거와 주의사항을 설명
- **제작 결과 산출**: 제작 가능 수량과 소재 활용률을 계산 — 미니백만 만드는 안, 남은 자투리로 태그까지 만드는 안을 함께 제시
- **Drop 확정**: 확정된 계산 결과를 받아 AI가 제품 소개문 생성

### AI를 쓰는 곳과 쓰지 않는 곳

사진을 보고 판단하는 일(색상·패턴 인식)과 말로 설명하는 일(추천 근거, 제품 소개문)은 AI가 담당합니다. 반면 **제작 가능 수량과 소재 활용률 계산은 AI가 아니라 자체 알고리즘이 담당**합니다. 패턴 조각을 긴 변 기준으로 정렬해 큰 조각부터 배치하고, 원래 방향과 90도 회전을 모두 시도해 여백이 가장 작아지는 위치를 고르는 2차원 재단 로직(guillotine 분할 방식)입니다. 같은 입력에는 항상 같은 결과가 나오도록 결정론적으로 설계했습니다.

## 기술 스택

| | FE (CND-FE) | BE (CND-BE) |
|---|---|---|
| 언어/프레임워크 | React 19, TypeScript, Vite | Java 21, Spring Boot 4.1.0 |
| 스타일/UI | Tailwind CSS 4, shadcn/ui | — |
| 데이터/통신 | TanStack Query, React Router | Spring Data JPA, PostgreSQL(Neon) |
| 외부 연동 | — | OpenAI(소재 태깅·추천 근거·소개문 생성), Cloudinary(이미지) |
| API 문서 | — | springdoc-openapi(Swagger UI) |
| 배포 | Vercel ([next-run.shop](https://www.next-run.shop/)) | Railway |

## 레포지토리 구성

- [`CND-FE`](https://github.com/Caution-new-driver/CND-FE): 사용자 화면(소재 등록, Drop 기획, 소재 추천, 제작 결과 확인 등)
- [`CND-BE`](https://github.com/Caution-new-driver/CND-BE): API 서버, AI 연동, 제작 수량/활용률 계산 로직
