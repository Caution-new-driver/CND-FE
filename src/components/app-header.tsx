import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mcmLogo from '@/assets/mcm-logo.png'
import { clearToken, useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

const TAGLINE = '— 잉여 소재로 다음 RUN을 기획하는 AI 상품기획 도구'
// 로그인 직후 한 번 차라락 펼쳐졌다가 자동으로 접히는 연출 지속 시간.
const AUTO_HIDE_MS = 2400

export function AppHeader() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showTagline, setShowTagline] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    setShowTagline(true)
    const timer = setTimeout(() => setShowTagline(false), AUTO_HIDE_MS)
    return () => clearTimeout(timer)
  }, [isAuthenticated])

  return (
    <header className="relative flex h-24 items-end justify-between border-b border-border px-6 pb-2">
      <button
        type="button"
        onClick={() => navigate('/materials')}
        onMouseEnter={() => setShowTagline(true)}
        onMouseLeave={() => setShowTagline(false)}
        className="flex cursor-pointer items-baseline gap-1.5 border-0 bg-transparent p-0"
      >
        <span className="font-brand text-[25px] font-semibold whitespace-nowrap">next:R.U.N.</span>
        <span
          className="grid overflow-hidden transition-[grid-template-columns] duration-500 ease-out"
          style={{ gridTemplateColumns: showTagline ? '1fr' : '0fr' }}
        >
          <span className="font-brand min-w-0 overflow-hidden text-[13px] whitespace-nowrap text-foreground">
            {TAGLINE}
          </span>
        </span>
      </button>
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
