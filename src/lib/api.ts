import { clearToken, getToken } from '@/lib/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  status: number
  // 백엔드가 message 외에 추가 필드(예: regenerationsRemaining)를 실어 보내는 에러 응답을
  // 위해 파싱된 본문 전체를 그대로 보관한다.
  body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData 전송 시 Content-Type을 직접 지정하면 브라우저가 multipart boundary를
  // 못 붙여서 요청이 깨짐 -> FormData면 기본 Content-Type을 아예 넣지 않음
  const isFormData = init?.body instanceof FormData
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    // 토큰 만료/위조로 401이 오면 로그인 팝업이 다시 뜨도록 저장된 토큰을 지움
    if (res.status === 401) clearToken()
    const body = await res.json().catch(() => null)
    // body?.message는 백엔드가 항상 한국어로 채워 보낸다(GlobalExceptionHandler). 아래 대체
    // 문구는 응답 자체가 JSON이 아니거나(프록시/네트워크 오류 등) message가 없는 극히 예외적인
    // 경우에만 쓰이므로, 영어 상태 텍스트 대신 한국어 안내로 통일해둔다.
    throw new ApiError(
      res.status,
      body?.message ?? '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
      body,
    )
  }

  // DELETE 등 204 No Content는 body가 없어서 res.json()이 파싱 에러를 던짐
  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}
