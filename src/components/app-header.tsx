import { clearToken, useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export function AppHeader() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="flex h-11 items-center justify-between border-b border-border px-4">
      <span className="text-sm font-semibold">next:R.U.N.</span>
      {isAuthenticated && (
        <Button variant="ghost" size="sm" onClick={() => clearToken()}>
          로그아웃
        </Button>
      )}
    </header>
  )
}
