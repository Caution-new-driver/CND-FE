import mcmLogo from '@/assets/mcm-logo.png'
import { clearToken, useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export function AppHeader() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="relative flex h-24 items-end justify-between border-b border-border px-6 pb-2">
      <span className="font-brand text-[25px] font-semibold">next:R.U.N.</span>
      <img
        src={mcmLogo}
        alt="MCM"
        className="absolute top-1/2 left-1/2 h-[72px] w-auto -translate-x-1/2 -translate-y-1/2"
      />
      {isAuthenticated && (
        <Button variant="ghost" size="sm" onClick={() => clearToken()}>
          로그아웃
        </Button>
      )}
    </header>
  )
}
