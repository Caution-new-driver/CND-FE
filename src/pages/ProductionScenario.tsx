import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ProductionScenarioListResponse, ProductionScenarioResponse } from '@/types/production'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CenteredPage } from '@/components/ui/centered-page'
import { FormMessage } from '@/components/ui/form-message'

export const PRODUCT_TYPE_LABEL: Record<string, string> = {
  MINI_BAG: '미니백',
  LUGGAGE_TAG: '태그',
}

export const SCENARIO_TITLE: Record<string, string> = {
  MAIN_ONLY: '미니백 단독',
  WITH_LUGGAGE_TAG: 'next:R.U.N 제안',
}

// 잔여 소재로 러기지 태그까지 추가 제작하는 안을 기본 추천으로 보여준다.
export const RECOMMENDED_SCENARIO_TYPE = 'WITH_LUGGAGE_TAG'

export function itemsLabel(scenario: ProductionScenarioResponse) {
  return scenario.items
    .filter((item) => item.quantity > 0)
    .map((item) => `${PRODUCT_TYPE_LABEL[item.productType] ?? item.productType} ${item.quantity}개`)
    .join(' + ')
}

export function ProductionScenarioPage() {
  const { dropId } = useParams<{ dropId: string }>()
  const navigate = useNavigate()

  // GET은 계산 이력이 없으면 에러를 던지므로, 이 페이지는 진입 시 항상 POST(재계산)부터 수행한다.
  // (확정된 소재 조합 기준으로 재계산하며, 이전 계산·선택 결과는 서버에서 교체됨)
  const calculateMutation = useMutation({
    mutationFn: () =>
      apiFetch<ProductionScenarioListResponse>(`/api/drops/${dropId}/production-scenarios`, {
        method: 'POST',
      }),
  })

  // StrictMode(개발 모드)에서 이 effect가 두 번 연달아 실행돼도 재계산 POST가 중복으로
  // 나가지 않도록 dropId 단위로 한 번만 호출되게 막는다 (MaterialCandidates.tsx와 동일한 이유).
  const calculatedForDropId = useRef<string | null>(null)
  useEffect(() => {
    if (dropId && calculatedForDropId.current !== dropId) {
      calculatedForDropId.current = dropId
      calculateMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropId])

  const selectMutation = useMutation({
    mutationFn: (scenarioId: string) =>
      apiFetch<ProductionScenarioListResponse>(
        `/api/drops/${dropId}/production-scenarios/${scenarioId}/select`,
        { method: 'POST' },
      ),
  })

  const data = selectMutation.data ?? calculateMutation.data
  const scenarios = data?.scenarios ?? []
  const headlineScenario = scenarios.find((s) => s.scenarioType === 'MAIN_ONLY') ?? scenarios[0]
  const miniBagQuantity =
    headlineScenario?.items.find((item) => item.productType === 'MINI_BAG')?.quantity ?? 0

  const isLoading = calculateMutation.isPending
  const hasError = calculateMutation.isError || selectMutation.isError

  if (!dropId) {
    return <FormMessage className="p-6">잘못된 접근입니다 (dropId 없음).</FormMessage>
  }

  return (
    <CenteredPage>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>제작 결과 및 제작안 비교</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <p className="py-2 text-[11.5px] text-muted-foreground">
              제작 가능 수량을 계산하는 중...
            </p>
          ) : hasError ? (
            <FormMessage>
              제작 가능 수량 계산에 실패했습니다. 이전 단계에서 소재 조합을 먼저 선택했는지 확인해주세요.
            </FormMessage>
          ) : !headlineScenario ? (
            <p className="py-2 text-[11.5px] text-muted-foreground">
              계산된 제작안이 없습니다.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center gap-0.5 rounded-md border border-border px-1.5 py-3">
                  <p className="text-[19px] font-bold">{miniBagQuantity}개</p>
                  <p className="text-[10px] text-muted-foreground">제작 가능 수량</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-0.5 rounded-md border border-border px-1.5 py-3">
                  <p className="text-[19px] font-bold">
                    {Math.round(headlineScenario.materialUtilizationRate)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">소재 활용률</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-0.5 rounded-md border border-border px-1.5 py-3">
                  <p className="text-[19px] font-bold">
                    {Math.round(100 - headlineScenario.materialUtilizationRate)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">남은 영역</p>
                </div>
              </div>

              <p className="text-[12.5px] font-bold">제작안 비교</p>

              <div className="grid grid-cols-2 gap-3">
                {scenarios.map((scenario) => {
                  const isRecommended = scenario.scenarioType === RECOMMENDED_SCENARIO_TYPE
                  return (
                    <div
                      key={scenario.scenarioId}
                      className={cn(
                        'flex flex-col gap-2.5 rounded-md border p-3.5',
                        isRecommended ? 'border-primary' : 'border-border',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[11.5px] font-bold">
                          {SCENARIO_TITLE[scenario.scenarioType] ?? scenario.scenarioType}
                        </p>
                        {isRecommended && <Badge variant="secondary">추천</Badge>}
                      </div>
                      <div className="flex items-center justify-between border-b border-border py-2 text-[11.5px]">
                        <p className="font-bold">{itemsLabel(scenario)}</p>
                        <p className="text-muted-foreground">
                          {Math.round(scenario.materialUtilizationRate)}%
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant={isRecommended ? 'default' : 'secondary'}
                          size="sm"
                          disabled={scenario.selected || selectMutation.isPending}
                          onClick={() => selectMutation.mutate(scenario.scenarioId)}
                        >
                          {scenario.selected
                            ? '선택됨'
                            : selectMutation.isPending
                              ? '선택 중...'
                              : '이 제작안 선택'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            이전 단계로
          </Button>
          <Button
            disabled={!data?.selectedScenarioId}
            onClick={() => navigate(`/drops/${dropId}/confirm`)}
          >
            다음: Drop 확정 · 소개문
          </Button>
        </CardFooter>
      </Card>
    </CenteredPage>
  )
}
