import { useMutation, useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
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
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  // f3 "이전 단계로"로 되돌아온 경우, 여기서 "다음"을 누를 때 또 새 Drop을 만들면
  // 방금 쓰던 Drop은 고아로 남고 매번 하나씩 더 생긴다. state로 넘어온 dropId가 있으면
  // 새로 만들지 않고 그 Drop으로 그대로 이어간다("새 Drop 만들기"로 들어온 경우엔
  // state가 없으니 평소대로 새로 만든다).
  const existingDropId = (location.state as { dropId?: string } | null)?.dropId

  const { data: template, isError: isTemplateError } = useQuery({
    queryKey: ['template', MINI_BAG_TEMPLATE_NAME],
    queryFn: () => apiFetch<TemplateResponse>(`/api/templates/${MINI_BAG_TEMPLATE_NAME}`),
    enabled: isAuthenticated,
  })

  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => apiFetch<DropResponse>('/api/drops', { method: 'POST' }),
    onSuccess: (drop) => navigate(`/drops/${drop.id}/design-requirement`),
  })

  function handleNext() {
    if (existingDropId) {
      navigate(`/drops/${existingDropId}/design-requirement`)
    } else {
      mutate()
    }
  }

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
        <CardFooter className="justify-end gap-3">
          <Button variant="link" onClick={() => navigate('/materials')}>
            새 소재 등록하기
          </Button>
          <Button onClick={handleNext} disabled={isPending || !template}>
            {isPending ? '기획을 시작하는 중...' : 'Drop 기획 시작하기 (Drop 생성)'}
          </Button>
        </CardFooter>
      </Card>
      </FlowFrame>
    </CenteredPage>
  )
}
