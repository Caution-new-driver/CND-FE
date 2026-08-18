import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { itemsLabel } from '@/pages/ProductionScenario'
import type { DropResponse } from '@/types/drop'
import type { ProductionScenarioListResponse } from '@/types/production'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'

export const DROP_STATUS_LABEL: Record<string, string> = {
  DRAFT: '모집중',
  CONFIRMED: '마감',
}

// DRAFT("모집중")는 지정된 브랜드 컬러(#B18155)로 강조, CONFIRMED("마감")는 secondary(톤 다운)
export function dropStatusBadgeVariant(status: string) {
  return status === 'DRAFT' ? 'default' : 'secondary'
}

export function dropStatusBadgeClassName(status: string) {
  return status === 'DRAFT' ? 'rounded-sm bg-[#B18155] text-white' : 'rounded-sm'
}

// 목록 행(DropRow)과 상세 팝업이 같은 쿼리 키를 써서, 행에서 이미 불러온 제작안
// 정보가 있으면 팝업을 열 때 다시 네트워크를 타지 않고 캐시를 그대로 재사용한다.
export function productionScenariosQueryKey(dropId: string) {
  return ['drops', dropId, 'production-scenarios']
}

// 팝업 하나만 만들어두고, 어떤 Drop을 보여줄지는 호출하는 쪽에서 `drop` prop으로 넘겨받는다.
// 열림/닫힘은 호출하는 쪽에서 useState로 관리(drop이 null이면 닫힘).
export function DropDetailDialog({
  drop,
  onClose,
}: {
  drop: DropResponse | null
  onClose: () => void
}) {
  const { isAuthenticated } = useAuth()

  const scenariosQuery = useQuery({
    queryKey: productionScenariosQueryKey(drop?.id ?? ''),
    queryFn: () =>
      apiFetch<ProductionScenarioListResponse>(`/api/drops/${drop?.id}/production-scenarios`),
    enabled: Boolean(drop) && isAuthenticated,
  })

  const scenarios = scenariosQuery.data?.scenarios ?? []
  const selectedScenario =
    scenarios.find((scenario) => scenario.selected) ??
    scenarios.find((scenario) => scenario.scenarioId === scenariosQuery.data?.selectedScenarioId)

  return (
    <Dialog open={drop !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        {drop && (
          <>
            <DialogHeader className="flex-row items-center justify-between space-y-0">
              <DialogTitle>{drop.name ?? drop.templateName + ' Drop'}</DialogTitle>
              <Badge
                variant={dropStatusBadgeVariant(drop.status)}
                className={dropStatusBadgeClassName(drop.status)}
              >
                <span className="translate-y-px">{DROP_STATUS_LABEL[drop.status] ?? drop.status}</span>
              </Badge>
            </DialogHeader>

            {scenariosQuery.isLoading ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">불러오는 중...</p>
            ) : scenariosQuery.isError || !selectedScenario ? (
              <FormMessage variant="muted">아직 계산된 제작 정보가 없습니다.</FormMessage>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Input readOnly value={itemsLabel(selectedScenario)} />
                <div className="grid grid-cols-2 gap-2.5">
                  <Input readOnly value={`${Math.round(selectedScenario.materialUtilizationRate)}%`} />
                  <Input
                    readOnly
                    value={
                      drop.expectedProductionDays != null ? `${drop.expectedProductionDays}일` : '기간 미정'
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={onClose}>
                <span className="translate-y-px">닫기</span>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
