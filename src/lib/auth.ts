import { useSyncExternalStore } from 'react'

const TOKEN_KEY = 'cnd_auth_token'

// apiFetch(순수 함수)와 React 컴포넌트가 같은 토큰 상태를 공유해야 해서
// Context 대신 최소 external store + useSyncExternalStore로 구현.
let token: string | null = localStorage.getItem(TOKEN_KEY)
const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) listener()
}

export function getToken() {
  return token
}

export function setToken(next: string) {
  token = next
  localStorage.setItem(TOKEN_KEY, next)
  emitChange()
}

// 로그아웃 + apiFetch가 401을 받았을 때 재로그인 팝업을 다시 띄우는 용도로 공용 사용
export function clearToken() {
  token = null
  localStorage.removeItem(TOKEN_KEY)
  emitChange()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAuth() {
  const token = useSyncExternalStore(subscribe, getToken)
  return { token, isAuthenticated: token !== null }
}
