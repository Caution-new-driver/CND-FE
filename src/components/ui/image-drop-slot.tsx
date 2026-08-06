import type { ChangeEvent, ReactNode } from "react"

import { cn } from "@/lib/utils"

// MaterialRegistration의 소재 사진 업로드에서 반복되던
// "점선 박스로 사진 선택 -> 선택 후엔 썸네일, 다시 클릭하면 교체" 패턴을 공통으로 뺌.
function ImageDropSlot({
  preview,
  badgeLabel,
  placeholder,
  onSelect,
  className,
}: {
  preview: string | null
  badgeLabel?: ReactNode
  placeholder: ReactNode
  onSelect: (file: File) => void
  className?: string
}) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) onSelect(file)
  }

  return (
    <label
      data-slot="image-drop-slot"
      className={cn(
        "relative flex shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded border text-center",
        preview ? "border-input" : "border-dashed border-input bg-muted/50",
        className
      )}
    >
      {preview ? (
        <img src={preview} alt="" className="size-full object-cover" />
      ) : (
        placeholder
      )}
      {preview && badgeLabel && (
        <span className="absolute top-1 left-1 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-bold text-background">
          {badgeLabel}
        </span>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </label>
  )
}

export { ImageDropSlot }
