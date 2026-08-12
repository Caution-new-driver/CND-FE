# CND-FE 🚗
2종보통멋쟁이 FE Repository

## 팀 규칙

### 브랜치 전략
- `main`: 미사용 -> 최종 제출 전 main에 한 번 병합.
- `dev`: 작업 기준 브랜치, Vercel Production Branch로 설정돼 있어 push하면 자동 배포됨
- 기능 작업은 `dev`에서 `feat/화면-이름` 브랜치 따서 진행 후 `dev`로 병합

### 커밋 컨벤션
CND-BE와 동일: `타입: 설명 (관련 ID)`

### PR 규칙
- `dev` 병합 전 로컬에서 `npm run build`(타입체크 포함) 통과 확인
- 백엔드 API 응답 형식이 바뀌는 작업은 백엔드 담당자와 미리 확인

### 코드 컨벤션
- 화면 단위 컴포넌트는 `src/pages/`
- 재사용 UI는 `src/components/ui/`(shadcn/ui 기반, 이미 세팅된 컴포넌트 최대한 재사용)
- API 호출은 `src/lib/api.ts`의 `apiFetch` 사용 (JSON은 자동 처리, 파일 업로드는 `FormData`로 넘기면 됨)
- 타입 정의는 `src/types/`
- API 호출은 `@tanstack/react-query`의 `useMutation`/`useQuery`로 감싸서 사용

### Ground Rule
- `.env` 파일 커밋 금지 (`.gitignore` 등록됨)
- API 주소를 코드에 하드코딩하지 말고 `import.meta.env.VITE_API_BASE_URL` 사용

## 개발 환경
- Node.js (LTS 권장), npm
- 로컬 서버: `http://localhost:5173`

## 작업 방법
1. 저장소 clone, `dev` 브랜치로 체크아웃
2. `npm install`
3. `.env.example`을 복사해 `.env` 생성 후 `VITE_API_BASE_URL=https://cnd-be-production.up.railway.app`로 채우기 (로컬 백엔드 띄워서 테스트할 땐 `http://localhost:8080`으로 바꿔서 사용)
4. `npm run dev`로 로컬 실행
5. `dev`에서 `feat/...` 브랜치 따서 작업 → 로컬 확인 → 커밋 → push → pr 올리기 → 코드리뷰 받고 수정 → `dev` 병합
