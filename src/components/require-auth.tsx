import { type FormEvent, type ReactNode, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ApiError, apiFetch } from '@/lib/api'
import { setToken, useAuth } from '@/lib/auth'
import type { LoginResponse } from '@/types/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'

// 별도 /login 라우트 대신, 보호 대상 화면(F1~F3) 위에 팝업을 띄우는 방식.
// 인증 전엔 배경 화면이 그대로 마운트돼 있으므로, 각 화면의 useQuery는
// enabled: isAuthenticated로 막아서 401을 미리 방지해야 한다.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [password, setPassword] = useState('')

  const loginMutation = useMutation({
    mutationFn: () =>
      apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    onSuccess: ({ token }) => {
      setToken(token)
      setPassword('')
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    loginMutation.mutate()
  }

  return (
    <>
      {children}
      <Dialog open={!isAuthenticated} disablePointerDismissal>
        <DialogContent showCloseButton={false} className="sm:max-w-lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>next:R.U.N. — 잉여 소재로 다음 RUN을 기획하는 AI 상품기획 도구</DialogTitle>
              <DialogDescription>MCM 관계자 공용 비밀번호를 입력하세요.</DialogDescription>
            </DialogHeader>
            <FormField label="비밀번호" htmlFor="login-password">
              <Input
                id="login-password"
                type="password"
                autoFocus
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (loginMutation.isError) loginMutation.reset()
                }}
              />
            </FormField>
            {loginMutation.isError && (
              <FormMessage>
                {loginMutation.error instanceof ApiError
                  ? loginMutation.error.message
                  : '로그인에 실패했습니다. 다시 시도해주세요.'}
              </FormMessage>
            )}
            <Button type="submit" disabled={loginMutation.isPending || !password}>
              {loginMutation.isPending ? '로그인하는 중...' : '로그인'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
