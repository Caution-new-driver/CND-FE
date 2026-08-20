import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import type { DropResponse } from "@/types/drop"

type FlowTab = {
  step: number
  label: string
  to?: string
  // f1~f6 순서 진행과 무관하게 항상 이동 가능한 탭(예: Drop 목록 조회)에 사용.
  alwaysClickable?: boolean
}

// f1~f6 전체 흐름의 탭 순서. dropId가 있어야만 이동 가능한 단계는 to를 조건부로 채운다.
// f2(Drop 기획)는 dropId 없이 재진입할 라우트가 없어 항상 to 없이(=클릭 불가) 둔다.
// 맨 끝의 "Drop 목록"은 순서상의 다음 단계가 아니라 별도 화면이라 항상 클릭 가능하게 둔다.
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
    { step: 7, label: "Drop 목록", to: "/drops", alwaysClickable: true },
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
  const { isAuthenticated } = useAuth()
  const tabs = buildFlowTabs(dropId)
  const sequentialTabs = tabs.filter((tab) => !tab.alwaysClickable)
  const utilityTabs = tabs.filter((tab) => tab.alwaysClickable)

  // Drop이 CONFIRMED로 확정된 뒤에는 02~05(편집 단계) 탭을 잠근다. 진입 경로(방금 확정 vs
  // 탭으로 재진입)와 무관하게 항상 정확해야 하므로 로컬 상태가 아니라 서버에서 직접 조회한다.
  const dropQuery = useQuery({
    queryKey: ["drops", dropId],
    queryFn: () => apiFetch<DropResponse>(`/api/drops/${dropId}`),
    enabled: Boolean(dropId) && isAuthenticated,
  })
  const isDropConfirmed = dropQuery.data?.status === "CONFIRMED"

  // 활성 탭이 바뀔 때 배경색을 즉시 스냅하는 대신, 이전 탭 자리에서 새 탭 자리로 슥
  // 미끄러져 이동하는 것처럼 보이도록 별도의 배경 조각(indicator)을 하나만 두고
  // 그 위치·너비만 트랜지션시킨다. 개별 탭 버튼 자체는 활성이어도 배경을 투명하게 둔다.
  const tabsRowRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const activeButton = activeTabRef.current
    if (!activeButton) return
    setIndicator({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
  }, [activeStep])

  function renderTab({ step, label, to, alwaysClickable }: FlowTab) {
    const isActive = step === activeStep
    // 01(소재 등록)·06(Drop 확정)·Drop 목록(alwaysClickable)은 확정 여부와 무관하게 그대로 두고,
    // 그 사이의 편집 단계(02~05)만 확정 후 잠근다.
    const isLockedByConfirm = isDropConfirmed && !alwaysClickable && step >= 2 && step <= 5
    const isClickable =
      Boolean(to) && !isActive && !isLockedByConfirm && (alwaysClickable || step <= activeStep)
    return (
      <button
        key={step}
        ref={isActive ? activeTabRef : undefined}
        type="button"
        disabled={!isClickable}
        onClick={() => to && navigate(to)}
        className={cn(
          "relative z-10 shrink-0 rounded-t-lg px-3.5 py-2 text-[11.5px] font-semibold whitespace-nowrap transition-colors",
          isActive
            ? "bg-transparent text-brand-cognac-foreground"
            : isClickable
              ? "bg-brand-cognac-muted text-brand-cognac-foreground"
              : "bg-muted text-muted-foreground",
          isClickable && "cursor-pointer hover:brightness-110",
          !isClickable && !isActive && "cursor-default",
        )}
      >
        {label}
      </button>
    )
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-border",
        maxWidthClassName,
        className,
      )}
    >
      <div className="bg-card px-4 pt-3">
        <div ref={tabsRowRef} className="relative flex items-end gap-1 overflow-x-auto">
          {indicator && (
            // 페이지 이동은 라우트 전환이라 FlowFrame이 매번 새로 마운트되고, 그래서
            // "이전 탭 → 새 탭"으로 실제로 미끄러지는 애니메이션은 만들 수 없다(이전 위치를
            // 그릴 프레임 자체가 없음). 대신 매번 새로 마운트되는 이 점을 활용해, 진입할 때마다
            // 활성 탭 자리에 팝/페이드로 살짝 등장하는 연출로 대신한다.
            <div
              key={activeStep}
              className="bg-brand-cognac animate-in fade-in-0 zoom-in-95 absolute bottom-0 z-0 rounded-t-lg duration-300 ease-out"
              style={{ left: indicator.left, width: indicator.width, top: 0 }}
            />
          )}
          {sequentialTabs.map(renderTab)}
          {/* 순서상의 다음 단계가 아닌 탭(Drop 목록)은 프레임 가장 오른쪽 가장자리로 분리 */}
          <div className="ml-auto flex shrink-0 gap-1">{utilityTabs.map(renderTab)}</div>
        </div>
      </div>
      <div className="bg-brand-cognac p-4">{children}</div>
    </div>
  )
}

export { FlowFrame }
