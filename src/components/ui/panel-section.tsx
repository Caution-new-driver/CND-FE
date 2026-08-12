import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

// MaterialRegistration 화면에서 4번 반복되던 "테두리 + 제목 + 내용" 블록을 공통으로 뺌.
function PanelSection({
  title,
  titleExtra,
  action,
  className,
  children,
}: {
  title: ReactNode
  titleExtra?: ReactNode
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section
      data-slot="panel-section"
      className={cn("flex flex-col gap-2.5 rounded-md border border-border p-3.5", className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[12.5px] font-bold">{title}</h2>
          {titleExtra}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export { PanelSection }
