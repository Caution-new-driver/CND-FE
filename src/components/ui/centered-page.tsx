import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

// 여러 페이지(DropStart, DesignRequirement, MaterialRegistration 등)에서
// 반복되던 "화면 중앙에 콘텐츠를 띄우는" 바깥 레이아웃을 공통으로 뺀 컴포넌트.
function CenteredPage({
  className,
  ...props
}: React.ComponentProps<"div"> & { children: ReactNode }) {
  return (
    <div
      data-slot="centered-page"
      className={cn("flex min-h-svh items-start justify-center p-6", className)}
      {...props}
    />
  )
}

export { CenteredPage }
