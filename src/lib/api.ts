const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData 전송 시 Content-Type을 직접 지정하면 브라우저가 multipart boundary를
  // 못 붙여서 요청이 깨짐 -> FormData면 기본 Content-Type을 아예 넣지 않음
  const isFormData = init?.body instanceof FormData
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: isFormData ? init?.headers : { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }

  return res.json() as Promise<T>
}
