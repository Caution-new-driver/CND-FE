import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

// DesignRequirement 등에서 반복되던 "Label + 입력 컴포넌트" 세로 배치를 공통으로 뺌.
function FormField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: ReactNode
  htmlFor?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div data-slot="form-field" className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

export { FormField }
