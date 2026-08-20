// TanStack Query의 캐시는 인메모리라 새로고침하면 사라진다. 백엔드에 조회용 GET이 없어서
// 그 값 자체가 유일한 사본인 데이터(F3 디자인 조건, F4 후보 계산 스냅샷)는 새로고침에도
// 살아남도록 localStorage에 별도로 저장해둔다.
const PREFIX = 'cnd-run:'

export function readCache<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

export function writeCache<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // 프라이빗 브라우징 등으로 localStorage를 못 쓰면 조용히 무시한다 — 매번 재계산되는 것으로 폴백.
  }
}
