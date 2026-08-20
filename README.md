<div align="center">

# 🚗 next:R.U.N.

### MCM의 잉여 소재로 다음 한정판 제품을 기획하는 AI 도구

명지대학교 **2종보통멋쟁이** 팀

[![CND-FE](https://img.shields.io/badge/CND--FE-repo-61DAFB?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Caution-new-driver/CND-FE)
[![CND-BE](https://img.shields.io/badge/CND--BE-repo-6DB33F?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Caution-new-driver/CND-BE)
[![Live](https://img.shields.io/badge/next--run.shop-live-FF6B6B?style=for-the-badge&logo=vercel&logoColor=white)](https://www.next-run.shop/)

</div>

---

## 🧩 문제 정의

MCM의 RUN(Recycle, Upcycle, Network) 프로젝트는 지금까지 **2만 1천 미터**의 잉여 소재를 **3만 5천 점**의 제품으로 되살렸습니다. 다만 이 성과는 아티스트 협업이나 학교 워크숍을 통해 그때그때 만들어지는 일회성 컬렉션에 가깝고, 상시 판매 라인은 아닙니다.

> 상시 라인으로 전환하려면 소재가 들어올 때마다 **이 소재로 상품을 만들 수 있는가**를 빠르게 판단해야 합니다.

잉여 소재는 매번 크기·색상·패턴·잔여 수량이 달라, 담당자는 매번 처음부터 적합 소재 선별·제작 가능 수량 산정·잔여 자투리 활용 방안을 사람이 눈으로 대조하고 수기로 계산하고 있습니다.

---

## ✨ 핵심 기능

<div align="center">

**📦 소재 등록 → 🎯 Drop 기획 → 📐 디자인 조건 입력 → 🔍 소재 추천 → 📊 제작 결과 산출 → ✅ Drop 확정**

</div>

| 단계 | 설명 |
|:---:|---|
| 📦 **소재 등록** | 사진을 올리면 AI(OpenAI 연동)가 색상·패턴·소재 종류를 신뢰도 점수와 함께 자동 태깅 |
| 🔍 **소재 추천** | 디자인 조건을 입력하면 재고 전체에서 조건을 통과한 소재만 걸러 점수를 매겨 추천, AI는 추천 근거와 주의사항을 설명 |
| 📊 **제작 결과 산출** | 제작 가능 수량과 소재 활용률을 계산 — 미니백만 만드는 안, 남은 자투리로 태그까지 만드는 안을 함께 제시 |
| ✅ **Drop 확정** | 확정된 계산 결과를 받아 AI가 제품 소개문 생성 |

### 🤖 AI를 쓰는 곳과 🧮 쓰지 않는 곳

| 🤖 AI가 담당 | 🧮 자체 알고리즘이 담당 |
|---|---|
| 사진을 보고 색상·패턴 판단 | **제작 가능 수량 계산** |
| 추천 근거·주의사항 설명 | **소재 활용률 계산** |
| 제품 소개문 생성 | 긴 변 우선 정렬 + 90° 회전 포함 best-fit 배치 (guillotine 분할) |

> 같은 입력에는 항상 같은 결과가 나오도록, **틀리면 안 되는 계산은 AI에게 맡기지 않았습니다.**

---

## 🛠️ 기술 스택

<div align="center">

**Frontend**

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)

**Backend**

![Java](https://img.shields.io/badge/Java_21-007396?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_4-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![ChatGPT](https://img.shields.io/badge/ChatGPT-74AA9C?style=for-the-badge&logo=openai&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

**Infra**

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=white)

</div>

---

## 📂 레포지토리 구성

| 레포 | 역할 |
|---|---|
| 🎨 [`CND-FE`](https://github.com/Caution-new-driver/CND-FE) | 사용자 화면(소재 등록, Drop 기획, 소재 추천, 제작 결과 확인 등) |
| ⚙️ [`CND-BE`](https://github.com/Caution-new-driver/CND-BE) | API 서버, AI 연동, 제작 수량/활용률 계산 로직 |

<div align="center">

🔗 **[next-run.shop](https://www.next-run.shop/)** 에서 직접 확인해보세요

</div>
