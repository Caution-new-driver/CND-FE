import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import type { DropResponse } from '@/types/drop'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function DropStartPage() {
  const navigate = useNavigate()

  const { mutate, data: drop, isPending, isError } = useMutation({
    mutationFn: () => apiFetch<DropResponse>('/api/drops', { method: 'POST' }),
  })

  if (!drop) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-medium">next:R.U.N</h1>
        <Button size="lg" onClick={() => mutate()} disabled={isPending}>
          {isPending ? '기획을 시작하는 중...' : '새 RUN Drop 기획하기'}
        </Button>
        {isError && (
          <p className="text-sm text-destructive">Drop 생성에 실패했습니다. 다시 시도해주세요.</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{drop.templateName} 템플릿</CardTitle>
          <CardDescription>패턴 치수는 고정이며 수정할 수 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">패턴 조각</p>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {drop.patternPieces.map((piece) => (
                <li key={piece.pieceName}>
                  {piece.pieceName} — {piece.widthMm}mm × {piece.heightMm}mm × {piece.quantity}개
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div>
            <p className="mb-2 text-sm font-medium">필요 부자재</p>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {drop.requiredAccessories.map((accessory) => (
                <li key={accessory.accessoryType}>
                  {accessory.accessoryType} {accessory.quantity}개
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={() => navigate(`/drops/${drop.id}/design-requirement`)}>다음</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
