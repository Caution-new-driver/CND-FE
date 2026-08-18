import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { itemsLabel, SCENARIO_TITLE } from '@/pages/ProductionScenario'
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
import { FormField } from '@/components/ui/form-field'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
              <DialogTitle>{drop.name ?? '미확정 드롭'}</DialogTitle>
              {drop.status === 'CONFIRMED' && (
                <Badge variant="secondary" className="rounded-sm text-white">
                  <span className="translate-y-px">제작 완료</span>
                </Badge>
              )}
            </DialogHeader>

            {scenariosQuery.isLoading ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">불러오는 중...</p>
            ) : scenariosQuery.isError || !selectedScenario ? (
              <FormMessage variant="muted">아직 계산된 제작 정보가 없습니다.</FormMessage>
            ) : (
              <div className="flex flex-col gap-2.5">
                <FormField label="템플릿" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                  <Input readOnly value={drop.templateName} />
                </FormField>
                <FormField label="구성" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                  <Input readOnly value={itemsLabel(selectedScenario)} />
                </FormField>
                <FormField label="제작안" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                  <Input
                    readOnly
                    value={SCENARIO_TITLE[selectedScenario.scenarioType] ?? selectedScenario.scenarioType}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-2.5">
                  <FormField label="활용률" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                    <Input readOnly value={`${Math.round(selectedScenario.materialUtilizationRate)}%`} />
                  </FormField>
                  <FormField label="예상 제작기간" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                    <Input
                      readOnly
                      value={
                        drop.expectedProductionDays != null ? `${drop.expectedProductionDays}일` : '기간 미정'
                      }
                    />
                  </FormField>
                </div>
                {drop.introText && (
                  <FormField label="AI 소개문" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                    <Textarea readOnly value={drop.introText} className="min-h-20" />
                  </FormField>
                )}
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
