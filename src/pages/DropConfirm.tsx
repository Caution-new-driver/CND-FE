import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { itemsLabel, SCENARIO_TITLE } from '@/pages/ProductionScenario'
import type {
  DropConfirmRequest,
  DropConfirmResponse,
  DropIntroTextRequest,
  DropIntroTextResponse,
  DropResponse,
} from '@/types/drop'
import type { ProductionScenarioListResponse } from '@/types/production'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { FormField } from '@/components/ui/form-field'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { PanelSection } from '@/components/ui/panel-section'
import { Textarea } from '@/components/ui/textarea'

// MVP 범위상 템플릿은 고정 "미니백" 하나뿐 (CLAUDE.md 참고)
const TEMPLATE_NAME = '미니백'

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

function isRegenerationsRemaining(
  body: unknown,
): body is { regenerationsRemaining: number } {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as { regenerationsRemaining?: unknown }).regenerationsRemaining === 'number'
  )
}

export function DropConfirmPage() {
  const { dropId } = useParams<{ dropId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [expectedProductionDays, setExpectedProductionDays] = useState('')
  const [introText, setIntroText] = useState('')
  // introText 중 서버에 마지막으로 저장된 값. Textarea 값과 다르면 "저장 안 한 변경사항"이 있다는 뜻이라
  // 화면 이동 버튼에서 유실 경고를 띄우는 기준으로 쓴다.
  const [savedIntroText, setSavedIntroText] = useState('')

  // b13(Drop 확정)이 아직 안 끝났으면 null. 확정 응답에 AI 소개문 초안(b14)까지 같이 온다.
  const [confirmResult, setConfirmResult] = useState<DropConfirmResponse | null>(null)
  const [regenerationsRemaining, setRegenerationsRemaining] = useState<number | null>(null)
  // Drop 확정 / 소개문 저장이 끝났을 때 안내 팝업으로 알려준다.
  const [successPopup, setSuccessPopup] = useState<{ title: string; description: string } | null>(
    null,
  )

  const scenariosQuery = useQuery({
    queryKey: ['drops', dropId, 'production-scenarios'],
    queryFn: () =>
      apiFetch<ProductionScenarioListResponse>(`/api/drops/${dropId}/production-scenarios`),
    enabled: Boolean(dropId) && isAuthenticated,
  })

  // f6에 "방금 확정"이 아니라 탭 이동·새로고침·"이어서 제작"으로 재진입한 경우,
  // confirmResult(로컬 상태)는 항상 null이라 이미 확정된 Drop인데도 빈 폼이 다시 나타났었다.
  // 서버에서 직접 조회해 확정 상태면 폼을 그 값으로 채운다.
  const dropQuery = useQuery({
    queryKey: ['drops', dropId],
    queryFn: () => apiFetch<DropResponse>(`/api/drops/${dropId}`),
    enabled: Boolean(dropId) && isAuthenticated,
  })
  const hydratedFromServer = useRef(false)
  useEffect(() => {
    if (hydratedFromServer.current) return
    const drop = dropQuery.data
    if (!drop || drop.status !== 'CONFIRMED') return
    hydratedFromServer.current = true
    setName(drop.name ?? '')
    setExpectedProductionDays(
      drop.expectedProductionDays != null ? String(drop.expectedProductionDays) : '',
    )
    setIntroText(drop.introText ?? '')
    setSavedIntroText(drop.introText ?? '')
    setRegenerationsRemaining(drop.regenerationsRemaining)
  }, [dropQuery.data])

  const scenarios = scenariosQuery.data?.scenarios ?? []
  const selectedScenario =
    scenarios.find((scenario) => scenario.selected) ??
    scenarios.find((scenario) => scenario.scenarioId === scenariosQuery.data?.selectedScenarioId)

  const isConfirmed = confirmResult !== null || dropQuery.data?.status === 'CONFIRMED'

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
      setIntroText(data.introText ?? '')
      setSavedIntroText(data.introText ?? '')
      // FlowFrame도 같은 쿼리 키(['drops', dropId])로 상태를 조회해 탭 잠금 여부를 정하므로,
      // 새로고침 없이도 바로 02~05 탭이 잠기도록 캐시를 무효화한다.
      queryClient.invalidateQueries({ queryKey: ['drops', dropId] })
      setSuccessPopup({
        title: 'Drop이 확정되었습니다',
        description: 'AI가 생성한 소개문 초안을 확인하고, 필요하면 수정 후 저장해주세요.',
      })
    },
  })

  // b14: AI 소개문 재생성 (b13 최초 생성 포함 Drop당 총 6회)
  const regenerateMutation = useMutation({
    mutationFn: () =>
      apiFetch<DropIntroTextResponse>(`/api/drops/${dropId}/intro-text`, { method: 'POST' }),
    onSuccess: (data) => {
      setIntroText(data.introText)
      setSavedIntroText(data.introText)
      setRegenerationsRemaining(data.regenerationsRemaining)
    },
    // 시도 횟수는 성공 여부와 무관하게 서버에서 이미 차감된 뒤라(백엔드 정책), 실패해도
    // 화면의 "남은 횟수"가 낡은 값으로 남지 않도록 에러 응답에 실려온 최신 값으로 맞춘다.
    onError: (error) => {
      if (error instanceof ApiError && isRegenerationsRemaining(error.body)) {
        setRegenerationsRemaining(error.body.regenerationsRemaining)
      }
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
      setSavedIntroText(data.introText)
      setRegenerationsRemaining(data.regenerationsRemaining)
      setSuccessPopup({ title: '저장완료', description: '소개문이 저장되었습니다.' })
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

  // 소개문을 고치거나 AI로 재생성만 하고 "저장"을 안 누른 상태로 화면을 벗어나면
  // 그 내용이 그대로 유실되므로, 벗어나기 전에 확인창을 띄운다.
  function navigateAwayFromIntro(to: string) {
    if (introText !== savedIntroText) {
      const confirmed = window.confirm(
        '저장하지 않은 소개문 변경사항이 있습니다. 이동하면 내용이 사라집니다. 계속하시겠습니까?',
      )
      if (!confirmed) return
    }
    navigate(to)
  }

  return (
    <CenteredPage>
      <FlowFrame activeStep={6} dropId={dropId}>
      <Card className="w-full">
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
                <FormField label="템플릿" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                  <Input readOnly value={TEMPLATE_NAME} />
                </FormField>
                <FormField label="구성" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                  <Input readOnly value={itemsLabel(selectedScenario)} />
                </FormField>
                <FormField label="활용률" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                  <Input readOnly value={`${Math.round(selectedScenario.materialUtilizationRate)}%`} />
                </FormField>
                <FormField label="제작안" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                  <Input
                    readOnly
                    value={SCENARIO_TITLE[selectedScenario.scenarioType] ?? selectedScenario.scenarioType}
                  />
                </FormField>
                <FormField label="이름" htmlFor="dropName" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                  <Input
                    id="dropName"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Drop 이름"
                    disabled={isConfirmed}
                  />
                </FormField>
                <FormField label="예상 제작기간" htmlFor="expectedDays" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                  <Input
                    id="expectedDays"
                    type="number"
                    min={1}
                    value={expectedProductionDays}
                    onChange={(event) => setExpectedProductionDays(event.target.value)}
                    placeholder="예상 제작기간 (일)"
                    disabled={isConfirmed}
                  />
                </FormField>
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
                      disabled={
                        saveIntroMutation.isPending ||
                        !introText.trim() ||
                        introText === savedIntroText
                      }
                      onClick={() => saveIntroMutation.mutate()}
                    >
                      {saveIntroMutation.isPending
                        ? '저장 중...'
                        : introText === savedIntroText
                          ? '저장완료'
                          : '저장'}
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
              </>
            )}
          </PanelSection>
        </CardContent>
        <CardFooter className="justify-between">
          {isConfirmed ? (
            <>
              <Button onClick={() => navigateAwayFromIntro('/materials')}>
                처음화면으로 돌아가기
              </Button>
              <div className="flex gap-2">
                <Button disabled>확정 완료</Button>
                <Button variant="secondary" onClick={() => navigateAwayFromIntro('/drops')}>
                  Drop 조회하기
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button onClick={() => navigate(`/drops/${dropId}/production-scenario`)}>
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
      </FlowFrame>

      <Dialog open={successPopup !== null} onOpenChange={(open) => !open && setSuccessPopup(null)}>
        <DialogContent showCloseButton={false} className="max-w-xs">
          {successPopup && (
            <>
              <DialogHeader>
                <DialogTitle>{successPopup.title}</DialogTitle>
                <DialogDescription>{successPopup.description}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setSuccessPopup(null)}>확인</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </CenteredPage>
  )
}
