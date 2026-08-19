import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { resolveResumePath } from '@/lib/resume-drop'
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

  // 뒤로가기 방지(replace: true)는 앱 내부 네비게이션만 막아서, 사용자가 주소창에
  // /drops/new를 직접 입력해 들어오는 경로는 여전히 열려있다. 그 경로로 들어와서
  // 무심코 "Drop 기획 시작하기"를 누르면 진행 중이던 Drop과 별개로 새 Drop이 하나 더
  // 생겨 미확정 상태로 방치되므로, 진입 시 미확정 Drop이 있으면 미리 알려준다.
  const { data: draftDrops } = useQuery({
    queryKey: ['drops', 'DRAFT'],
    queryFn: () => apiFetch<DropResponse[]>('/api/drops?status=DRAFT'),
    enabled: isAuthenticated,
  })

  const resumeMutation = useMutation({
    mutationFn: (dropId: string) => resolveResumePath(dropId),
    onSuccess: (path) => navigate(path),
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
          {draftDrops && draftDrops.length > 0 && (
            <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3.5">
              <p className="text-[11.5px] font-bold text-destructive">
                이미 진행 중인 미확정 Drop이 {draftDrops.length}개 있어요. 새로 만들면 기존 Drop과는
                별개로 하나 더 생성됩니다.
              </p>
              <div className="flex flex-col gap-1.5">
                {draftDrops.map((drop) => (
                  <div
                    key={drop.id}
                    className="flex items-center justify-between rounded-md border border-border bg-background p-2"
                  >
                    <span className="text-[11px] text-muted-foreground">
                      {drop.name ?? '미확정 Drop'}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-sm"
                      disabled={resumeMutation.isPending}
                      onClick={() => resumeMutation.mutate(drop.id)}
                    >
                      <span className="translate-y-px">이어서 제작</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
