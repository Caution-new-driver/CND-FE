import mcmLogo from '@/assets/mcm-logo.png'
import { clearToken, useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export function AppHeader() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="relative flex h-32 items-center justify-between border-b border-border px-4">
      <span className="text-sm font-semibold">next:R.U.N.</span>
      <img
        src={mcmLogo}
        alt="MCM"
        className="absolute left-1/2 h-28 w-auto -translate-x-1/2"
      />
      {isAuthenticated && (
        <Button variant="ghost" size="sm" onClick={() => clearToken()}>
          로그아웃
        </Button>
      )}
    </header>
  )
}
