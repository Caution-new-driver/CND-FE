import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AccessoryColor } from '@/types/drop'
import type { MaterialCandidateResponse } from '@/types/candidate'
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

const ACCESSORY_OPTIONS: { value: AccessoryColor; label: string }[] = [
  { value: 'GOLD', label: '골드 지퍼 · 링' },
  { value: 'SILVER', label: '실버 지퍼 · 링' },
  { value: 'BLACK', label: '블랙 지퍼 · 링' },
]

export function MaterialCandidatesPage() {
  const { dropId } = useParams<{ dropId: string }>()
  const navigate = useNavigate()

  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [pointMaterialId, setPointMaterialId] = useState('')
  const [accessoryColor, setAccessoryColor] = useState<AccessoryColor | ''>('')

  // TODO(b9~b11 미착수): 실제 추천 API 나오면 경로/응답 필드 맞춰서 수정
  const candidatesQuery = useQuery({
    queryKey: ['drops', dropId, 'material-candidates'],
    queryFn: () => apiFetch<MaterialCandidateResponse[]>(`/api/drops/${dropId}/material-candidates`),
  })

  const candidates = candidatesQuery.data ?? []

  // AI 추천 1순위를 기본 선택값으로 잡아둔다
  useEffect(() => {
    if (!selectedMaterialId && candidates.length > 0) {
      setSelectedMaterialId(candidates[0].materialId)
    }
  }, [candidates, selectedMaterialId])

  // TODO(b9~b11 미착수): 실제 확정 API 나오면 경로/요청 형식 맞춰서 수정
  const confirmMutation = useMutation({
    mutationFn: () => {
      return apiFetch(`/api/drops/${dropId}/material-selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: selectedMaterialId,
          pointMaterialId: pointMaterialId || null,
          accessoryColor: accessoryColor || null,
        }),
      })
    },
    onSuccess: () => navigate(`/drops/${dropId}/production-scenario`),
  })

  if (!dropId) {
    return <FormMessage className="p-6">잘못된 접근입니다 (dropId 없음).</FormMessage>
  }

  return (
    <CenteredPage>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>AI 추천 후보 확인</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PanelSection title="AI 추천 후보 (최대 3개)">
            {candidatesQuery.isLoading ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">추천 후보를 불러오는 중...</p>
            ) : candidatesQuery.isError ? (
              <FormMessage>추천 후보를 불러오지 못했습니다. 다시 시도해주세요.</FormMessage>
            ) : candidates.length === 0 ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">
                적합한 소재 후보가 없습니다. 조건을 재검색하거나 기획을 종료해주세요.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {candidates.map((candidate) => {
                  const isSelected = selectedMaterialId === candidate.materialId
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setSelectedMaterialId(candidate.materialId)}
                      className={cn(
                        'flex flex-col items-start gap-2 rounded-md border p-2.5 text-left transition-colors',
                        isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-input',
                      )}
                    >
                      <div className="h-16 w-full overflow-hidden rounded bg-muted">
                        {candidate.imageUrl && (
                          <img src={candidate.imageUrl} alt="" className="size-full object-cover" />
                        )}
                      </div>
                      <p className="w-full truncate text-[11.5px] font-medium">{candidate.label}</p>
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
            <div className="grid grid-cols-3 gap-3">
              <Select value={selectedMaterialId} onValueChange={(value) => setSelectedMaterialId(value ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="주 소재 선택" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.materialId} value={candidate.materialId}>
                      {candidate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={pointMaterialId} onValueChange={(value) => setPointMaterialId(value ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="포인트 소재 (선택)" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.materialId} value={candidate.materialId}>
                      {candidate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={accessoryColor}
                onValueChange={(value) => setAccessoryColor((value as AccessoryColor) ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="부자재 선택" />
                </SelectTrigger>
                <SelectContent>
                  {ACCESSORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            disabled={!selectedMaterialId || confirmMutation.isPending}
          >
            {confirmMutation.isPending ? '처리 중...' : '다음: 제작 가능 수량 계산'}
          </Button>
        </CardFooter>
      </Card>
    </CenteredPage>
  )
}
