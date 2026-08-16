import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { itemsLabel, SCENARIO_TITLE } from '@/pages/ProductionScenario'
import type {
  DropConfirmRequest,
  DropConfirmResponse,
  DropIntroTextRequest,
  DropIntroTextResponse,
} from '@/types/drop'
import type { ProductionScenarioListResponse } from '@/types/production'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CenteredPage } from '@/components/ui/centered-page'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { PanelSection } from '@/components/ui/panel-section'
import { Textarea } from '@/components/ui/textarea'

// MVP 범위상 템플릿은 고정 "미니백" 하나뿐 (CLAUDE.md 참고)
const TEMPLATE_NAME = '미니백'

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

export function DropConfirmPage() {
  const { dropId } = useParams<{ dropId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [name, setName] = useState('')
  const [expectedProductionDays, setExpectedProductionDays] = useState('')
  const [introText, setIntroText] = useState('')

  // b13(Drop 확정)이 아직 안 끝났으면 null. 확정 응답에 AI 소개문 초안(b14)까지 같이 온다.
  const [confirmResult, setConfirmResult] = useState<DropConfirmResponse | null>(null)
  const [regenerationsRemaining, setRegenerationsRemaining] = useState<number | null>(null)

  const scenariosQuery = useQuery({
    queryKey: ['drops', dropId, 'production-scenarios'],
    queryFn: () =>
      apiFetch<ProductionScenarioListResponse>(`/api/drops/${dropId}/production-scenarios`),
    enabled: Boolean(dropId) && isAuthenticated,
  })

  const scenarios = scenariosQuery.data?.scenarios ?? []
  const selectedScenario =
    scenarios.find((scenario) => scenario.selected) ??
    scenarios.find((scenario) => scenario.scenarioId === scenariosQuery.data?.selectedScenarioId)

  const isConfirmed = confirmResult !== null

  // b13: Drop 확정 (이름·예상 제작기간 저장 + 상태 CONFIRMED 전환 + AI 소개문 초안 생성)
  const confirmMutation = useMutation({
    mutationFn: () =>
      apiFetch<DropConfirmResponse>(`/api/drops/${dropId}/confirm`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          expectedProductionDays: Number(expectedProductionDays),
        } satisfies DropConfirmRequest),
      }),
    onSuccess: (data) => {
      setConfirmResult(data)
      setRegenerationsRemaining(data.regenerationsRemaining)
      if (data.introText) setIntroText(data.introText)
    },
  })

  // b14: AI 소개문 재생성 (b13 최초 생성 포함 Drop당 총 6회)
  const regenerateMutation = useMutation({
    mutationFn: () =>
      apiFetch<DropIntroTextResponse>(`/api/drops/${dropId}/intro-text`, { method: 'POST' }),
    onSuccess: (data) => {
      setIntroText(data.introText)
      setRegenerationsRemaining(data.regenerationsRemaining)
    },
  })

  // b14: 담당자가 고친 소개문 최종본 저장 (AI 재호출 아님, 횟수 제한과 무관)
  const saveIntroMutation = useMutation({
    mutationFn: () =>
      apiFetch<DropIntroTextResponse>(`/api/drops/${dropId}/intro-text`, {
        method: 'PATCH',
        body: JSON.stringify({ introText } satisfies DropIntroTextRequest),
      }),
    onSuccess: (data) => {
      setRegenerationsRemaining(data.regenerationsRemaining)
    },
  })

  const isLoading = scenariosQuery.isLoading
  const hasError = scenariosQuery.isError

  if (!dropId) {
    return <FormMessage className="p-6">잘못된 접근입니다 (dropId 없음).</FormMessage>
  }

  const canConfirm =
    !isConfirmed &&
    Boolean(selectedScenario) &&
    name.trim() !== '' &&
    expectedProductionDays.trim() !== '' &&
    Number(expectedProductionDays) > 0

  return (
    <CenteredPage>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>RUN Drop 확정 · 소개문</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <PanelSection title="Drop 확정 정보">
            {isLoading ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">불러오는 중...</p>
            ) : hasError ? (
              <FormMessage>
                제작안 정보를 불러오지 못했습니다. 이전 단계에서 제작안을 먼저 선택했는지 확인해주세요.
              </FormMessage>
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
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Drop 이름"
                  readOnly={isConfirmed}
                />
                <Input
                  type="number"
                  min={1}
                  value={expectedProductionDays}
                  onChange={(event) => setExpectedProductionDays(event.target.value)}
                  placeholder="예상 제작기간 (일)"
                  readOnly={isConfirmed}
                />
                {confirmMutation.isError && (
                  <FormMessage>
                    {apiErrorMessage(confirmMutation.error, 'Drop 확정에 실패했습니다. 다시 시도해주세요.')}
                  </FormMessage>
                )}
              </>
            )}
          </PanelSection>

          <PanelSection title="소개문 초안">
            {!isConfirmed ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">
                Drop을 확정하면 AI가 소개문 초안을 자동으로 생성합니다.
              </p>
            ) : (
              <>
                <Textarea
                  value={introText}
                  onChange={(event) => setIntroText(event.target.value)}
                  placeholder="소개문 초안이 여기에 표시됩니다."
                  className="min-h-28"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] text-muted-foreground">
                    AI 재생성 남은 횟수: {regenerationsRemaining ?? 0}회
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={regenerateMutation.isPending || (regenerationsRemaining ?? 0) <= 0}
                      onClick={() => regenerateMutation.mutate()}
                    >
                      {regenerateMutation.isPending ? '생성 중...' : 'AI로 다시 생성'}
                    </Button>
                    <Button
                      size="sm"
                      disabled={saveIntroMutation.isPending || !introText.trim()}
                      onClick={() => saveIntroMutation.mutate()}
                    >
                      {saveIntroMutation.isPending ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                </div>
                {regenerateMutation.isError && (
                  <FormMessage>
                    {apiErrorMessage(regenerateMutation.error, 'AI 재생성에 실패했습니다. 다시 시도해주세요.')}
                  </FormMessage>
                )}
                {saveIntroMutation.isError && (
                  <FormMessage>
                    {apiErrorMessage(saveIntroMutation.error, '저장에 실패했습니다. 다시 시도해주세요.')}
                  </FormMessage>
                )}
                {saveIntroMutation.isSuccess && !saveIntroMutation.isPending && (
                  <p className="text-[10.5px] text-muted-foreground">저장되었습니다.</p>
                )}
              </>
            )}
          </PanelSection>
        </CardContent>
        <CardFooter className="justify-between">
          {isConfirmed ? (
            <>
              <Button variant="secondary" onClick={() => navigate('/materials')}>
                처음화면으로 돌아가기
              </Button>
              <div className="flex gap-2">
                <Button disabled>확정 완료</Button>
                {/* TODO: Drop 조회 화면이 아직 없어서 임시 버튼만 배치 */}
                <Button variant="secondary" onClick={() => {}}>
                  Drop 조회하기
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => navigate(-1)}>
                이전 단계로
              </Button>
              <Button
                disabled={!canConfirm || confirmMutation.isPending}
                onClick={() => confirmMutation.mutate()}
              >
                {confirmMutation.isPending ? '확정 중...' : 'Drop 확정하기'}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </CenteredPage>
  )
}
