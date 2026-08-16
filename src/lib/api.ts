import { clearToken, getToken } from '@/lib/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
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
    throw new ApiError(res.status, body?.message ?? `API error ${res.status}: ${res.statusText}`)
  }

  // DELETE 등 204 No Content는 body가 없어서 res.json()이 파싱 에러를 던짐
  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}
