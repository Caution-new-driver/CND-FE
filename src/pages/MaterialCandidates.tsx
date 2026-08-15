import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
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
  const queryClient = useQueryClient()

  const [mainCandidateId, setMainCandidateId] = useState('')
  const [pointCandidateId, setPointCandidateId] = useState('')
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<Record<string, string>>({})

  const candidatesQueryKey = ['drops', dropId, 'material-candidates']

  // GET은 이전에 저장된 결과만 반환하므로, 결과가 비어있으면 POST로 재계산한다.
  const candidatesQuery = useQuery({
    queryKey: candidatesQueryKey,
    queryFn: () =>
      apiFetch<MaterialCandidateListResponse>(`/api/drops/${dropId}/material-candidates`),
    enabled: Boolean(dropId),
  })

  const candidates = useMemo(
    () => candidatesQuery.data?.candidates ?? [],
    [candidatesQuery.data],
  )

  const calculateMutation = useMutation({
    mutationFn: () =>
      apiFetch<MaterialCandidateListResponse>(`/api/drops/${dropId}/material-candidates`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(candidatesQueryKey, data)
    },
  })

  useEffect(() => {
    if (
      candidatesQuery.isSuccess &&
      candidates.length === 0 &&
      !calculateMutation.isPending &&
      !calculateMutation.isSuccess
    ) {
      calculateMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatesQuery.isSuccess, candidates.length])

  // AI 추천 1순위를 기본 선택값으로 잡아둔다
  useEffect(() => {
    if (!mainCandidateId && candidates.length > 0) {
      setMainCandidateId(candidates[0].candidateId)
    }
  }, [candidates, mainCandidateId])

  const accessoriesQuery = useQuery({
    queryKey: ['accessories'],
    queryFn: () => apiFetch<AccessoryResponse[]>('/api/accessories'),
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

  const isLoadingCandidates = candidatesQuery.isLoading || calculateMutation.isPending
  const hasCandidateError = candidatesQuery.isError || calculateMutation.isError

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
                disabled={calculateMutation.isPending}
              >
                {calculateMutation.isPending ? '재계산 중...' : '다시 계산'}
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
                        return selected ? candidateLabel(selected) : undefined
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
                        return selected ? candidateLabel(selected) : undefined
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
                            return selected ? accessoryLabel(selected) : undefined
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
            disabled={!mainCandidateId || confirmMutation.isPending}
          >
            {confirmMutation.isPending ? '처리 중...' : '다음: 제작 가능 수량 계산'}
          </Button>
        </CardFooter>
      </Card>
    </CenteredPage>
  )
}
