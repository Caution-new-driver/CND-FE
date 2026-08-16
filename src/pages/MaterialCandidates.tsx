import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { MATERIAL_COLOR_LABEL, MATERIAL_TYPE_LABEL } from '@/lib/material-options'
import type {
  AccessoryResponse,
  AccessorySelectionRequest,
  MaterialCandidateListResponse,
  MaterialCandidateResponse,
  MaterialSelectionRequest,
} from '@/types/candidate'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CenteredPage } from '@/components/ui/centered-page'
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

function accessoryLabel(accessory: AccessoryResponse) {
  return `${accessory.accessoryType} · ${accessory.color}`
}

export function MaterialCandidatesPage() {
  const { dropId } = useParams<{ dropId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [mainCandidateId, setMainCandidateId] = useState('')
  const [pointCandidateId, setPointCandidateId] = useState('')
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<Record<string, string>>({})

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

  // b9~b11 계산은 항상 "필터링 -> 채점 -> 결과 교체" 흐름이라, GET으로 이전 결과를 먼저
  // 보여주지 않고 진입 시마다 POST로 최신 디자인 조건 기준 재계산한다. 이전 화면(디자인
  // 조건 입력)에서 조건을 바꾸고 다시 들어와도 항상 최신 후보를 보게 하기 위함이다.
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
    },
    onError: () => setCalcStatus('error'),
  })

  // StrictMode(개발 모드)에서 이 effect가 두 번 연달아 실행돼도 재계산 POST가
  // 중복으로 나가지 않도록 dropId 단위로 한 번만 호출되게 막는다. 이 API는 호출될
  // 때마다 서버의 이전 결과를 교체해버리므로, 중복 호출되면 화면이 들고 있는
  // candidateId와 서버에 남은 candidateId가 어긋나 확정 시 404가 날 수 있다.
  const calculatedForDropId = useRef<string | null>(null)
  useEffect(() => {
    if (dropId && isAuthenticated && calculatedForDropId.current !== dropId) {
      calculatedForDropId.current = dropId
      calculateMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropId, isAuthenticated])

  const candidates = useMemo(
    () => candidatesResult?.candidates ?? [],
    [candidatesResult],
  )

  // AI 추천 1순위를 기본 선택값으로 잡아둔다
  useEffect(() => {
    if (!mainCandidateId && candidates.length > 0) {
      setMainCandidateId(candidates[0].candidateId)
    }
  }, [candidates, mainCandidateId])

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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>AI 추천 후보 확인</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PanelSection
            title="AI 추천 후보 (최대 3개)"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => calculateMutation.mutate()}
                disabled={isLoadingCandidates}
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
                      onClick={() => setMainCandidateId(candidate.candidateId)}
                      className={cn(
                        'flex flex-col items-start gap-2 rounded-md border p-2.5 text-left transition-colors',
                        isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-input',
                      )}
                    >
                      <div className="h-16 w-full overflow-hidden rounded bg-muted">
                        {candidate.material.imageUrlFull && (
                          <img
                            src={candidate.material.imageUrlFull}
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
                        {Math.round(candidate.matchScore)}%
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
                <Select value={mainCandidateId} onValueChange={(value) => setMainCandidateId(value ?? '')}>
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
                <Select
                  value={pointCandidateId || NO_POINT_MATERIAL}
                  onValueChange={(value) =>
                    setPointCandidateId(value === NO_POINT_MATERIAL ? '' : (value ?? ''))
                  }
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

          {confirmMutation.isError && (
            <FormMessage>확정에 실패했습니다. 다시 시도해주세요.</FormMessage>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            이전 단계로
          </Button>
          <Button
            onClick={() => confirmMutation.mutate()}
            disabled={!mainCandidateId || isLoadingCandidates || confirmMutation.isPending}
          >
            {confirmMutation.isPending ? '처리 중...' : '다음: 제작 가능 수량 계산'}
          </Button>
        </CardFooter>
      </Card>
    </CenteredPage>
  )
}
