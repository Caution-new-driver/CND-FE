import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { itemsLabel, SCENARIO_TITLE } from '@/pages/ProductionScenario'
import type { ProductionScenarioListResponse } from '@/types/production'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CenteredPage } from '@/components/ui/centered-page'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { PanelSection } from '@/components/ui/panel-section'
import { Textarea } from '@/components/ui/textarea'

// MVP 범위상 템플릿은 고정 "미니백" 하나뿐 (CLAUDE.md 참고)
const TEMPLATE_NAME = '미니백'

function draftIntroText(
  scenarioLabel: string,
  itemsSummary: string,
  utilizationRate: number,
) {
  return `next:R.U.N의 이번 Drop은 ${scenarioLabel}을 기반으로 ${itemsSummary}를 제작합니다. ` +
    `잉여 소재 활용률 ${Math.round(utilizationRate)}%를 달성해, 남은 원단·가죽을 낭비 없이 사용한 한정 컬렉션입니다.`
}

export function DropConfirmPage() {
  const { dropId } = useParams<{ dropId: string }>()
  const navigate = useNavigate()
  const [introText, setIntroText] = useState('')
  const [showConfirmNotice, setShowConfirmNotice] = useState(false)

  // b13/b14(Drop 확정 · 소개문 저장) API가 아직 없어서, f6에서 이미 계산·확정된
  // 제작 시나리오 결과를 다시 조회해 요약 정보로만 사용한다.
  const scenariosMutation = useMutation({
    mutationFn: () =>
      apiFetch<ProductionScenarioListResponse>(`/api/drops/${dropId}/production-scenarios`, {
        method: 'POST',
      }),
  })

  useEffect(() => {
    if (dropId) {
      scenariosMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropId])

  const scenarios = scenariosMutation.data?.scenarios ?? []
  const selectedScenario =
    scenarios.find((scenario) => scenario.selected) ??
    scenarios.find((scenario) => scenario.scenarioId === scenariosMutation.data?.selectedScenarioId)

  useEffect(() => {
    if (selectedScenario && !introText) {
      setIntroText(
        draftIntroText(
          SCENARIO_TITLE[selectedScenario.scenarioType] ?? selectedScenario.scenarioType,
          itemsLabel(selectedScenario),
          selectedScenario.materialUtilizationRate,
        ),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScenario])

  const isLoading = scenariosMutation.isPending
  const hasError = scenariosMutation.isError

  if (!dropId) {
    return <FormMessage className="p-6">잘못된 접근입니다 (dropId 없음).</FormMessage>
  }

  return (
    <CenteredPage>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>RUN Drop 확정 · 소개문</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <PanelSection
            title="Drop 확정 정보"
            titleExtra={<Badge variant="secondary">f6</Badge>}
          >
            {isLoading ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">불러오는 중...</p>
            ) : hasError ? (
              <FormMessage>제작안 정보를 불러오지 못했습니다.</FormMessage>
            ) : !selectedScenario ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">
                확정된 제작안이 없습니다. 이전 단계에서 제작안을 먼저 선택해주세요.
              </p>
            ) : (
              <>
                <Input readOnly value={TEMPLATE_NAME} />
                <Input readOnly value={itemsLabel(selectedScenario)} />
                <Input readOnly value={`${Math.round(selectedScenario.materialUtilizationRate)}%`} />
                <Input
                  readOnly
                  value={SCENARIO_TITLE[selectedScenario.scenarioType] ?? selectedScenario.scenarioType}
                />
              </>
            )}
          </PanelSection>

          <PanelSection
            title="소개문 초안"
            titleExtra={<Badge variant="secondary">f7 · AI</Badge>}
          >
            <Textarea
              value={introText}
              onChange={(event) => setIntroText(event.target.value)}
              placeholder="소개문 초안이 여기에 표시됩니다."
              className="min-h-28"
            />
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedScenario}
                onClick={() => {
                  if (!selectedScenario) return
                  setIntroText(
                    draftIntroText(
                      SCENARIO_TITLE[selectedScenario.scenarioType] ?? selectedScenario.scenarioType,
                      itemsLabel(selectedScenario),
                      selectedScenario.materialUtilizationRate,
                    ),
                  )
                }}
              >
                AI로 다시 생성
              </Button>
            </div>
            <p className="text-[10.5px] text-muted-foreground">
              실제 AI(Terra) 생성 API가 아직 연결되지 않아 임시로 만든 초안입니다. 최종 승인 전 직접 다듬어주세요.
            </p>
          </PanelSection>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              이전 단계로
            </Button>
            <Badge variant="secondary">상태: DRAFT → CONFIRMED</Badge>
          </div>
          <Button
            disabled={!selectedScenario}
            onClick={() => setShowConfirmNotice(true)}
          >
            Drop 확정하기
          </Button>
        </CardFooter>
        {showConfirmNotice && (
          <div className="px-(--card-spacing) pb-(--card-spacing)">
            <FormMessage variant="muted">
              Drop 확정 API(b13/b14)가 아직 준비되지 않았습니다. 소개문 내용은 이 화면에만 임시로 보관됩니다.
            </FormMessage>
          </div>
        )}
      </Card>
    </CenteredPage>
  )
}
