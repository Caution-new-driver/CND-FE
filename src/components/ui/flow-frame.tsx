import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { cn } from "@/lib/utils"

type FlowTab = {
  step: number
  label: string
  to?: string
}

// f1~f6 전체 흐름의 탭 순서. dropId가 있어야만 이동 가능한 단계는 to를 조건부로 채운다.
// f2(Drop 기획)는 dropId 없이 재진입할 라우트가 없어 항상 to 없이(=클릭 불가) 둔다.
function buildFlowTabs(dropId: string | undefined): FlowTab[] {
  return [
    { step: 1, label: "01 소재 등록", to: "/materials" },
    { step: 2, label: "02 Drop 기획" },
    {
      step: 3,
      label: "03 디자인 조건",
      to: dropId ? `/drops/${dropId}/design-requirement` : undefined,
    },
    { step: 4, label: "04 소재 추천", to: dropId ? `/drops/${dropId}/candidates` : undefined },
    {
      step: 5,
      label: "05 제작 결과",
      to: dropId ? `/drops/${dropId}/production-scenario` : undefined,
    },
    { step: 6, label: "06 Drop 확정", to: dropId ? `/drops/${dropId}/confirm` : undefined },
  ]
}

// 새 와이어프레임의 "브라우저 창" 톤(꼬냑 프레임 + 상단 탭)을 감싸는 공용 레이아웃.
// 각 페이지는 기존 <Card>를 이 안에 그대로 넣기만 하면 된다.
function FlowFrame({
  activeStep,
  dropId,
  maxWidthClassName,
  className,
  children,
}: {
  activeStep: number
  dropId?: string
  maxWidthClassName?: string
  className?: string
  children: ReactNode
}) {
  const navigate = useNavigate()
  const tabs = buildFlowTabs(dropId)

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-border",
        maxWidthClassName,
        className,
      )}
    >
      <div className="bg-card px-4 pt-3">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(({ step, label, to }) => {
            const isActive = step === activeStep
            const isClickable = Boolean(to) && step <= activeStep && !isActive
            return (
              <button
                key={step}
                type="button"
                disabled={!isClickable}
                onClick={() => to && navigate(to)}
                className={cn(
                  "shrink-0 rounded-t-lg px-3.5 py-2 text-[11.5px] font-semibold whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-brand-cognac text-brand-cognac-foreground"
                    : "bg-muted text-muted-foreground",
                  isClickable && "cursor-pointer hover:bg-muted-foreground/20",
                  !isClickable && !isActive && "cursor-default",
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="bg-brand-cognac p-4">{children}</div>
    </div>
  )
}

export { FlowFrame }
