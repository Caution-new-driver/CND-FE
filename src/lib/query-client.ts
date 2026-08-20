import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 백엔드가 4xx로 응답하는 건 "아직 계산 안 됨"처럼 정상적인 상태 표현이지
      // 네트워크 문제가 아니라서, 재시도해도 항상 같은 응답만 반복된다. 기본값(최대
      // 3번, 지수 백오프)대로 두면 그런 화면이 뜨기까지 7초 넘게 "불러오는 중..."만
      // 보이게 되므로, 4xx는 재시도하지 않고 그 외(네트워크 오류·5xx)만 재시도한다.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 3
      },
    },
  },
})
