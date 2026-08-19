import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { DropResponse, TemplateResponse } from '@/types/drop'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CenteredPage } from '@/components/ui/centered-page'
import { FlowFrame } from '@/components/ui/flow-frame'
import { FormMessage } from '@/components/ui/form-message'

const MINI_BAG_TEMPLATE_NAME = '미니백'

export function DropStartPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const { data: template, isError: isTemplateError } = useQuery({
    queryKey: ['template', MINI_BAG_TEMPLATE_NAME],
    queryFn: () => apiFetch<TemplateResponse>(`/api/templates/${MINI_BAG_TEMPLATE_NAME}`),
    enabled: isAuthenticated,
  })

  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => apiFetch<DropResponse>('/api/drops', { method: 'POST' }),
    // replace: true로 f2 히스토리 항목을 지워서, f3에서 브라우저 뒤로가기를 눌러도
    // "Drop이 생성된 f2"로 돌아가지 않고 f1로 건너뛴다. 그렇지 않으면 뒤로가기 후
    // "Drop 기획 시작하기"를 다시 눌렀을 때 미확정 Drop이 중복 생성된다.
    onSuccess: (drop) => navigate(`/drops/${drop.id}/design-requirement`, { replace: true }),
  })

  return (
    <CenteredPage>
      <FlowFrame activeStep={2}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>새 RUN Drop 기획하기</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isTemplateError && <FormMessage>템플릿 정보를 불러오지 못했습니다.</FormMessage>}
          {template && (
            <div className="flex flex-col gap-2.5 rounded-md border border-border p-3.5">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold">{template.templateName} 템플릿</h3>
                <Badge variant="secondary">고정</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {template.patternPieces.map((piece) => (
                  <div
                    key={piece.pieceName}
                    className="flex flex-col gap-1.5 rounded-md border border-border p-2.5"
                  >
                    <span className="text-xs text-muted-foreground">{piece.pieceName}</span>
                    <Badge variant="secondary" className="w-fit">
                      {piece.widthMm}×{piece.heightMm}mm · {piece.quantity}장
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {template.requiredAccessories.map((accessory) => (
                  <Badge key={accessory.accessoryType} variant="secondary">
                    {accessory.accessoryType} {accessory.quantity}개
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {isError && <FormMessage>Drop 생성에 실패했습니다. 다시 시도해주세요.</FormMessage>}
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="link" onClick={() => navigate('/materials')}>
            새 소재 등록하기
          </Button>
          <Button onClick={() => mutate()} disabled={isPending || !template}>
            {isPending ? '기획을 시작하는 중...' : 'Drop 기획 시작하기 (Drop 생성)'}
          </Button>
        </CardFooter>
      </Card>
      </FlowFrame>
    </CenteredPage>
  )
}
