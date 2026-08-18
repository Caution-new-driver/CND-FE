import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { resolveResumePath } from '@/lib/resume-drop'
import { DropDetailDialog, productionScenariosQueryKey } from '@/components/drop-detail-dialog'
import { itemsLabel } from '@/pages/ProductionScenario'
import type { DropResponse } from '@/types/drop'
import type { ProductionScenarioListResponse } from '@/types/production'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CenteredPage } from '@/components/ui/centered-page'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FlowFrame } from '@/components/ui/flow-frame'
import { FormMessage } from '@/components/ui/form-message'

// 목록 API(GET /api/drops)는 제작 수량·활용률을 내려주지 않아서, 행마다 개별적으로
// production-scenarios를 조회해 요약을 채운다. 팝업(DropDetailDialog)과 쿼리 키를
// 공유하므로 "상세보기"를 눌러도 다시 네트워크를 타지 않는다.
function DropRow({
  drop,
  onViewDetail,
  onRequestDelete,
}: {
  drop: DropResponse
  onViewDetail: (drop: DropResponse) => void
  onRequestDelete: (drop: DropResponse) => void
}) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const resumeMutation = useMutation({
    mutationFn: () => resolveResumePath(drop.id),
    onSuccess: (path) => navigate(path),
  })

  const scenariosQuery = useQuery({
    queryKey: productionScenariosQueryKey(drop.id),
    queryFn: () =>
      apiFetch<ProductionScenarioListResponse>(`/api/drops/${drop.id}/production-scenarios`),
    enabled: isAuthenticated,
  })

  const scenarios = scenariosQuery.data?.scenarios ?? []
  const selectedScenario =
    scenarios.find((scenario) => scenario.selected) ??
    scenarios.find((scenario) => scenario.scenarioId === scenariosQuery.data?.selectedScenarioId)

  const summary = scenariosQuery.isLoading
    ? '불러오는 중...'
    : selectedScenario
      ? `${itemsLabel(selectedScenario)} · 활용률 ${Math.round(selectedScenario.materialUtilizationRate)}%`
      : '아직 계산된 제작 정보가 없습니다'

  return (
    <div className="flex items-center gap-3 rounded-md border border-border p-3">
      <div className="size-14 shrink-0 rounded-md border border-border bg-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-[12.5px] font-bold">{drop.name ?? '미확정 DROP'}</p>
        <p className="truncate text-[11px] text-muted-foreground">{summary}</p>
      </div>
      {drop.status === 'CONFIRMED' && (
        <Badge variant="secondary" className="rounded-sm text-white">
          <span className="translate-y-px">제작 완료</span>
        </Badge>
      )}
      {drop.status === 'DRAFT' && (
        <Button
          size="sm"
          variant="secondary"
          className="rounded-sm text-white"
          disabled={resumeMutation.isPending}
          onClick={() => resumeMutation.mutate()}
        >
          <span className="translate-y-px">
            {resumeMutation.isPending ? '확인 중...' : '이어서 제작'}
          </span>
        </Button>
      )}
      {drop.status === 'DRAFT' && (
        <Button
          size="sm"
          variant="destructive"
          className="rounded-sm"
          onClick={() => onRequestDelete(drop)}
        >
          <span className="translate-y-px">삭제</span>
        </Button>
      )}
      <Button size="sm" className="rounded-sm" onClick={() => onViewDetail(drop)}>
        <span className="translate-y-px">상세보기</span>
      </Button>
    </div>
  )
}

export function DropListPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [selectedDrop, setSelectedDrop] = useState<DropResponse | null>(null)
  const [dropPendingDelete, setDropPendingDelete] = useState<DropResponse | null>(null)

  const dropsQuery = useQuery({
    queryKey: ['drops'],
    queryFn: () => apiFetch<DropResponse[]>('/api/drops'),
    enabled: isAuthenticated,
  })

  const deleteMutation = useMutation({
    mutationFn: (dropId: string) => apiFetch(`/api/drops/${dropId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drops'] })
      setDropPendingDelete(null)
    },
  })

  const drops = dropsQuery.data ?? []

  return (
    <CenteredPage>
      <FlowFrame activeStep={7}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>전체 Drop 목록</CardTitle>
            <CardAction>
              <Button className="rounded-sm" onClick={() => navigate('/drops/new')}>
                새 Drop 만들기
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {dropsQuery.isLoading ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">불러오는 중...</p>
            ) : dropsQuery.isError ? (
              <FormMessage>Drop 목록을 불러오지 못했습니다.</FormMessage>
            ) : drops.length === 0 ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">등록된 Drop이 없습니다.</p>
            ) : (
              drops.map((drop) => (
                <DropRow
                  key={drop.id}
                  drop={drop}
                  onViewDetail={setSelectedDrop}
                  onRequestDelete={(target) => {
                    deleteMutation.reset()
                    setDropPendingDelete(target)
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>
      </FlowFrame>

      <DropDetailDialog drop={selectedDrop} onClose={() => setSelectedDrop(null)} />

      <Dialog
        open={dropPendingDelete !== null}
        onOpenChange={(open) => !open && !deleteMutation.isPending && setDropPendingDelete(null)}
      >
        <DialogContent showCloseButton={false} className="max-w-sm">
          {dropPendingDelete && (
            <>
              <DialogHeader>
                <DialogTitle>Drop 삭제</DialogTitle>
                <DialogDescription>
                  "{dropPendingDelete.name ?? '미확정 DROP'}"을(를) 삭제하시겠습니까? 저장된 조건·선택·계산
                  결과가 모두 사라지며 되돌릴 수 없습니다.
                </DialogDescription>
              </DialogHeader>
              {deleteMutation.isError && (
                <FormMessage>삭제에 실패했습니다. 다시 시도해주세요.</FormMessage>
              )}
              <DialogFooter>
                <Button
                  variant="secondary"
                  disabled={deleteMutation.isPending}
                  onClick={() => setDropPendingDelete(null)}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(dropPendingDelete.id)}
                >
                  {deleteMutation.isPending ? '삭제 중...' : '삭제'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </CenteredPage>
  )
}
