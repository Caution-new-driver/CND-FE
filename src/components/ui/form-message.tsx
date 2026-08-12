import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// 각 페이지마다 따로 작성돼 있던 "성공/실패/안내" 문구용 <p>를 공통 컴포넌트로 뺌.
const formMessageVariants = cva("text-sm", {
  variants: {
    variant: {
      error: "text-destructive",
      success: "text-primary",
      muted: "text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "error",
  },
})

function FormMessage({
  className,
  variant,
  ...props
}: React.ComponentProps<"p"> & VariantProps<typeof formMessageVariants>) {
  return (
    <p
      data-slot="form-message"
      className={cn(formMessageVariants({ variant }), className)}
      {...props}
    />
  )
}

export { FormMessage, formMessageVariants }
