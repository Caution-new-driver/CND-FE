import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { cloudinaryThumbnail } from '@/lib/cloudinary-image'
import { readCache, writeCache } from '@/lib/persisted-cache'
import { cn } from '@/lib/utils'
import { MATERIAL_COLOR_LABEL, MATERIAL_TYPE_LABEL } from '@/lib/material-options'
import type {
  AccessoryResponse,
  AccessorySelectionRequest,
  AccessorySelectionResponse,
  MaterialCandidateListResponse,
  MaterialCandidateResponse,
  MaterialSelectionRequest,
  MaterialSelectionResponse,
} from '@/types/candidate'
import type { DesignRequirementResponse, DropResponse } from '@/types/drop'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CenteredPage } from '@/components/ui/centered-page'
import { FlowFrame } from '@/components/ui/flow-frame'
import { FormField } from '@/components/ui/form-field'
import { FormMessage } from '@/components/ui/form-message'
import { PanelSection } from '@/components/ui/panel-section'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function candidateLabel(candidate: MaterialCandidateResponse) {
  const { material } = candidate
  return `${MATERIAL_TYPE_LABEL[material.materialType]} · ${MATERIAL_COLOR_LABEL[material.color]} (${material.materialCode})`
}

const NO_POINT_MATERIAL = '__none__'

// 추천 후보 카드가 새로 나타날 때 매치 스코어가 0에서 실제 값까지 올라가며 표시되는
// 연출. candidateId가 재계산마다 새로 발급되므로 그걸 key로 넘기면 새 후보가 뜰 때만
// 자연스럽게 애니메이션이 다시 시작된다(같은 카드에서 선택 상태만 바뀔 때는 재실행 안 됨).
function AnimatedMatchScore({ value }: { value: number }) {
  const target = Math.round(value)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const durationMs = 700
    const startTime = performance.now()
    let frameId: number

    function tick(now: number) {
      const progress = Math.min((now - startTime) / durationMs, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(Math.round(target * eased))
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [target])

  return <>{display}%</>
}

function accessoryLabel(accessory: AccessoryResponse) {
  return `${accessory.accessoryType} · ${accessory.color}`
}

// f4 재진입 시 재계산을 건너뛸지 판단하는 기준 — 계산에 실제로 영향을 주는 4개 필드만 비교한다.
function requirementsEqual(
  a: DesignRequirementResponse | undefined,
  b: DesignRequirementResponse | undefined,
) {
  if (!a || !b) return false
  return (
    a.materialType === b.materialType &&
    a.color === b.color &&
    a.pattern === b.pattern &&
    a.minGrade === b.minGrade
  )
}

export function MaterialCandidatesPage() {
  const { dropId } = useParams<{ dropId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  // FlowFrame의 탭 잠금(dropId 기준 GET /api/drops/{dropId})과 같은 캐시 키를 써서, 확정된
  // Drop을 URL로 직접 열었을 때도 이 화면 자체의 컨트롤들이 활성 상태로 보이지 않게 한다.
  const dropQuery = useQuery({
    queryKey: ['drops', dropId],
    queryFn: () => apiFetch<DropResponse>(`/api/drops/${dropId}`),
    enabled: Boolean(dropId) && isAuthenticated,
  })
  const isDropConfirmed = dropQuery.data?.status === 'CONFIRMED'

  const [mainCandidateId, setMainCandidateId] = useState('')
  const [pointCandidateId, setPointCandidateId] = useState('')
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<Record<string, string>>({})

  // 주 소재를 바꾸면 포인트 소재를 "사용 안 함"으로 초기화한다. 그대로 두면 방금 주
  // 소재로 고른 후보가 포인트 소재 목록에서도 사라지지 않은 채(과거 선택값) 남을 수 있고,
  // 주 소재와 같은 후보가 포인트로 선택된 상태로 남는 등 조합이 꼬일 수 있다.
  function handleMainCandidateChange(candidateId: string) {
    setMainCandidateId(candidateId)
    setPointCandidateId('')
  }

  // 조합 선택 상태를 전부 비운다 (재계산·재진입 시 이전 선택이 새 후보 목록과
  // 엇갈리지 않도록 함께 초기화).
  function resetSelection() {
    setMainCandidateId('')
    setPointCandidateId('')
    setSelectedAccessoryIds({})
  }

  // calculateMutation.isPending/.data를 화면에서 직접 참조하면, onSuccess는 최신 데이터로
  // 정상 실행되는데도 그 다음 리렌더가 이전 상태(대기 중)를 계속 보여주는 현상이 있어서
  // (StrictMode 개발 모드에서 재현됨) onSuccess/onMutate/onError에서 직접 로컬 state를
  // 갱신하는 방식으로 우회한다.
  const [candidatesResult, setCandidatesResult] = useState<MaterialCandidateListResponse | null>(null)
  const [calcStatus, setCalcStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')

  // b9~b11 재계산은 호출될 때마다 실제 OpenAI 호출 + 기존 후보 삭제·재저장을 하는 비용이
  // 큰 작업이다(백엔드에도 캐싱/멱등성 체크 없음). 그래서 계산 결과와, 그 계산에 쓰인 디자인
  // 조건의 스냅샷을 같이 캐싱해두고, f4 재진입 시 조건이 그대로면 재계산을 건너뛴다.
  // TanStack Query 인메모리 캐시는 새로고침하면 사라져서(그러면 매번 강제 재계산하게 됨)
  // localStorage(persisted-cache)에 저장한다.
  const calculateMutation = useMutation({
    mutationFn: () =>
      apiFetch<MaterialCandidateListResponse>(`/api/drops/${dropId}/material-candidates`, {
        method: 'POST',
      }),
    onMutate: () => setCalcStatus('pending'),
    onSuccess: (data) => {
      setCandidatesResult(data)
      setCalcStatus('success')
      resetSelection()
      writeCache(`material-candidates:${dropId}`, data)
      const requirementUsed = readCache<DesignRequirementResponse>(
        `design-requirement:${dropId}`,
      )
      if (requirementUsed) {
        writeCache(`material-candidates-requirement-snapshot:${dropId}`, requirementUsed)
      }
    },
    onError: () => setCalcStatus('error'),
  })

  // StrictMode(개발 모드)에서 이 effect가 두 번 연달아 실행돼도 중복 호출되지 않도록
  // dropId 단위로 한 번만 실행되게 막는다. 진입 시마다 무조건 재계산하는 대신, 캐시된
  // 후보 결과와 그때 쓰인 디자인 조건 스냅샷이 지금 조건과 같으면 재계산 없이 그 결과를
  // 그대로 재사용한다("다시 계산" 버튼은 이 비교 없이 항상 강제로 재계산함).
  const calculatedForDropId = useRef<string | null>(null)
  useEffect(() => {
    if (!dropId || !isAuthenticated || calculatedForDropId.current === dropId) return
    calculatedForDropId.current = dropId

    const cachedCandidates = readCache<MaterialCandidateListResponse>(
      `material-candidates:${dropId}`,
    )
    const cachedRequirementSnapshot = readCache<DesignRequirementResponse>(
      `material-candidates-requirement-snapshot:${dropId}`,
    )
    const currentRequirement = readCache<DesignRequirementResponse>(
      `design-requirement:${dropId}`,
    )

    if (cachedCandidates && requirementsEqual(cachedRequirementSnapshot, currentRequirement)) {
      setCandidatesResult(cachedCandidates)
      setCalcStatus('success')
    } else {
      calculateMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropId, isAuthenticated])

  const candidates = useMemo(
    () => candidatesResult?.candidates ?? [],
    [candidatesResult],
  )

  // "이어서 제작" 재진입 시 이전에 저장해둔 조합(주 소재·포인트 소재·부자재)을 복원한다.
  // 저장된 적 없는 새 진입이면(404) AI 추천 1순위를 기본 선택값으로 잡아둔다.
  // candidateId는 재계산할 때마다 새로 발급돼서 저장은 candidateId가 아니라 실제 소재
  // materialId 기준이라, 지금 후보 목록에서 같은 materialId를 가진 후보를 다시 찾아 매칭한다.
  const restoredSelectionForDropId = useRef<string | null>(null)
  useEffect(() => {
    if (!dropId || candidates.length === 0 || restoredSelectionForDropId.current === dropId) return
    restoredSelectionForDropId.current = dropId

    apiFetch<MaterialSelectionResponse>(`/api/drops/${dropId}/material-selection`)
      .then((selection) => {
        const mainCandidate = candidates.find(
          (candidate) => candidate.material.id === selection.mainMaterial.id,
        )
        // 저장된 조합은 있지만(f3에서 조건을 바꿔 재계산한 뒤라) 그 소재가 지금 후보 목록에
        // 없으면 저장된 적 없는 새 진입과 똑같이 AI 추천 1순위로 대체한다. 그냥 두면 아무 것도
        // 선택 안 된 채로 남아서 "다음" 버튼이 계속 비활성 상태가 된다.
        setMainCandidateId(mainCandidate ? mainCandidate.candidateId : candidates[0].candidateId)

        const pointMaterialId = selection.pointMaterial?.id
        const pointCandidate = pointMaterialId
          ? candidates.find((candidate) => candidate.material.id === pointMaterialId)
          : undefined
        if (pointCandidate) setPointCandidateId(pointCandidate.candidateId)
      })
      .catch(() => {
        // 저장된 조합이 없는 새 진입 — AI 추천 1순위를 기본값으로 잡는다.
        setMainCandidateId(candidates[0].candidateId)
      })

    apiFetch<AccessorySelectionResponse>(`/api/drops/${dropId}/accessory-selections`)
      .then((response) => {
        if (response.selections.length === 0) return
        setSelectedAccessoryIds(
          Object.fromEntries(
            response.selections.map((selection) => [selection.accessoryType, selection.accessoryId]),
          ),
        )
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropId, candidates])

  const accessoriesQuery = useQuery({
    queryKey: ['accessories'],
    queryFn: () => apiFetch<AccessoryResponse[]>('/api/accessories'),
    enabled: isAuthenticated,
  })

  const accessoryGroups = useMemo(() => {
    const groups = new Map<string, AccessoryResponse[]>()
    for (const accessory of accessoriesQuery.data ?? []) {
      const list = groups.get(accessory.accessoryType) ?? []
      list.push(accessory)
      groups.set(accessory.accessoryType, list)
    }
    return Array.from(groups.entries())
  }, [accessoriesQuery.data])

  // "다음"을 누르기 전에 필요한 부자재 종류(지퍼·링)를 전부 골랐는지 확인한다. 이게 없으면
  // 주 소재만 고르고 부자재는 하나도 안 골라도 다음 단계로 넘어가져서, 나중에 f6 확정 시점에야
  // "부자재 조합을 먼저 확정해야 합니다" 에러로 뒤늦게, 엉뚱한 곳에서 막히는 문제가 있었다.
  const hasAllAccessories =
    accessoryGroups.length > 0 &&
    accessoryGroups.every(([accessoryType]) => Boolean(selectedAccessoryIds[accessoryType]))

  const confirmMutation = useMutation({
    mutationFn: async () => {
      await apiFetch(`/api/drops/${dropId}/material-selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainCandidateId,
          pointCandidateId: pointCandidateId || null,
        } satisfies MaterialSelectionRequest),
      })

      const accessoryIds = Object.values(selectedAccessoryIds).filter(Boolean)
      if (accessoryIds.length > 0) {
        await apiFetch(`/api/drops/${dropId}/accessory-selections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessoryIds } satisfies AccessorySelectionRequest),
        })
      }
    },
    onSuccess: () => navigate(`/drops/${dropId}/production-scenario`),
  })

  if (!dropId) {
    return <FormMessage className="p-6">잘못된 접근입니다 (dropId 없음).</FormMessage>
  }

  const isLoadingCandidates = calcStatus === 'pending'
  const hasCandidateError = calcStatus === 'error'

  return (
    <CenteredPage>
      <FlowFrame activeStep={4} dropId={dropId}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI 추천 후보 확인</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PanelSection
            title="AI 추천 후보 (최대 3개) - 주 소재 선택"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => calculateMutation.mutate()}
                disabled={isLoadingCandidates || isDropConfirmed}
              >
                {isLoadingCandidates ? '재계산 중...' : '다시 계산'}
              </Button>
            }
          >
            {isLoadingCandidates ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">추천 후보를 불러오는 중...</p>
            ) : hasCandidateError ? (
              <FormMessage>추천 후보를 불러오지 못했습니다. 다시 시도해주세요.</FormMessage>
            ) : candidates.length === 0 ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">
                적합한 소재 후보가 없습니다. 조건을 재검색하거나 기획을 종료해주세요.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {candidates.map((candidate) => {
                  const isSelected = mainCandidateId === candidate.candidateId
                  return (
                    <button
                      key={candidate.candidateId}
                      type="button"
                      disabled={isDropConfirmed}
                      onClick={() => handleMainCandidateChange(candidate.candidateId)}
                      className={cn(
                        'disabled:pointer-events-none disabled:opacity-50',
                        'flex flex-col items-start gap-2 rounded-md border p-2.5 text-left transition-colors',
                        isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-input',
                      )}
                    >
                      <div className="h-16 w-full overflow-hidden rounded bg-muted">
                        {candidate.material.imageUrlFull && (
                          <img
                            src={cloudinaryThumbnail(candidate.material.imageUrlFull)}
                            alt=""
                            className="size-full object-cover"
                          />
                        )}
                      </div>
                      <p className="w-full truncate text-[11.5px] font-medium">
                        {candidateLabel(candidate)}
                      </p>
                      {candidate.aiReasons && (
                        <p className="line-clamp-2 text-[10.5px] text-muted-foreground">
                          {candidate.aiReasons}
                        </p>
                      )}
                      <Badge variant={isSelected ? 'default' : 'secondary'}>
                        <AnimatedMatchScore value={candidate.matchScore} />
                      </Badge>
                    </button>
                  )
                })}
              </div>
            )}
            <p className="text-[10.5px] text-muted-foreground">
              적합한 소재가 없으면 자동 대체 없이 조건 재검색 또는 기획 종료
            </p>
          </PanelSection>

          <PanelSection title="조합 선택">
            {candidates.length === 0 ? (
              <p className="py-1 text-[11.5px] text-muted-foreground">
                추천 후보가 있어야 조합을 선택할 수 있습니다.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label={
                    <>
                      주 소재{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        (앞면·뒷면 - 포인트 소재 미선택 시 모든 면)
                      </span>
                    </>
                  }
                  className="[&_label]:text-xs [&_label]:text-muted-foreground"
                >
                  <Select
                    value={mainCandidateId}
                    onValueChange={(value) => handleMainCandidateChange(value ?? '')}
                    disabled={isDropConfirmed}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="주 소재 선택">
                        {(value: string) => {
                          const selected = candidates.find((candidate) => candidate.candidateId === value)
                          return selected ? candidateLabel(selected) : '주 소재로 사용할 후보를 선택하세요'
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((candidate) => (
                        <SelectItem key={candidate.candidateId} value={candidate.candidateId}>
                          {candidateLabel(candidate)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  label={
                    <>
                      포인트 소재{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        (옆면·바닥면)
                      </span>
                    </>
                  }
                  className="[&_label]:text-xs [&_label]:text-muted-foreground"
                >
                  <Select
                    value={pointCandidateId || NO_POINT_MATERIAL}
                    onValueChange={(value) =>
                      setPointCandidateId(value === NO_POINT_MATERIAL ? '' : (value ?? ''))
                    }
                    disabled={isDropConfirmed}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="포인트 소재 (선택)">
                        {(value: string) => {
                          if (value === NO_POINT_MATERIAL || !value) return '사용 안 함'
                          const selected = candidates.find((candidate) => candidate.candidateId === value)
                          return selected ? candidateLabel(selected) : '포인트 소재를 선택하세요'
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_POINT_MATERIAL}>사용 안 함</SelectItem>
                      {candidates
                        .filter((candidate) => candidate.candidateId !== mainCandidateId)
                        .map((candidate) => (
                          <SelectItem key={candidate.candidateId} value={candidate.candidateId}>
                            {candidateLabel(candidate)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            )}

            {accessoriesQuery.isError ? (
              <FormMessage>부자재 목록을 불러오지 못했습니다.</FormMessage>
            ) : (
              accessoryGroups.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {accessoryGroups.map(([accessoryType, accessories]) => (
                    <Select
                      key={accessoryType}
                      value={selectedAccessoryIds[accessoryType] ?? ''}
                      onValueChange={(value) =>
                        setSelectedAccessoryIds((prev) => ({ ...prev, [accessoryType]: value ?? '' }))
                      }
                      disabled={isDropConfirmed}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`${accessoryType} 색상 선택`}>
                          {(value: string) => {
                            const selected = accessories.find((accessory) => accessory.id === value)
                            return selected ? accessoryLabel(selected) : `${accessoryType} 색상을 선택하세요`
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {accessories.map((accessory) => (
                          <SelectItem key={accessory.id} value={accessory.id}>
                            {accessoryLabel(accessory)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              )
            )}
          </PanelSection>

          {!hasAllAccessories && <FormMessage>부자재를 모두 선택해주세요.</FormMessage>}

          {confirmMutation.isError && (
            <FormMessage>
              {confirmMutation.error instanceof ApiError
                ? confirmMutation.error.message
                : '확정에 실패했습니다. 다시 시도해주세요.'}
            </FormMessage>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Button onClick={() => navigate(`/drops/${dropId}/design-requirement`)}>
            이전 단계로
          </Button>
          <Button
            onClick={() => confirmMutation.mutate()}
            disabled={
              !mainCandidateId ||
              !hasAllAccessories ||
              isLoadingCandidates ||
              confirmMutation.isPending ||
              isDropConfirmed
            }
          >
            {confirmMutation.isPending ? '처리 중...' : '다음: 제작 가능 수량 계산'}
          </Button>
        </CardFooter>
      </Card>
      </FlowFrame>
    </CenteredPage>
  )
}
