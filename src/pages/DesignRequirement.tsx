import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { readCache, writeCache } from '@/lib/persisted-cache'
import type {
  DesignRequirementResponse,
  MaterialColor,
  MaterialGrade,
  MaterialPattern,
  MaterialType,
} from '@/types/drop'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CenteredPage } from '@/components/ui/centered-page'
import { FormField } from '@/components/ui/form-field'
import { FormMessage } from '@/components/ui/form-message'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MATERIAL_TYPE_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: 'LEATHER', label: '가죽' },
  { value: 'COATED_CANVAS', label: '코팅캔버스' },
  { value: 'FABRIC', label: '원단' },
  { value: 'SYNTHETIC', label: '합성피혁' },
  { value: 'OTHER', label: '기타' },
]

const COLOR_OPTIONS: { value: MaterialColor; label: string }[] = [
  { value: 'BLACK', label: '블랙' },
  { value: 'BROWN', label: '브라운' },
  { value: 'BEIGE', label: '베이지' },
  { value: 'WHITE', label: '화이트' },
  { value: 'RED', label: '레드' },
  { value: 'BLUE', label: '블루' },
  { value: 'MULTI', label: '멀티' },
  { value: 'OTHER', label: '기타' },
]

const PATTERN_OPTIONS: { value: MaterialPattern; label: string }[] = [
  { value: 'MONOGRAM', label: '모노그램' },
  { value: 'SOLID', label: '무지' },
  { value: 'GEOMETRIC', label: '지오메트릭' },
  { value: 'STRIPE', label: '스트라이프' },
  { value: 'OTHER', label: '기타' },
]

const MIN_GRADE_OPTIONS: MaterialGrade[] = ['A', 'B', 'C']

function optionLabel(options: readonly { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label
}

export function DesignRequirementPage() {
  const { dropId } = useParams<{ dropId: string }>()
  const navigate = useNavigate()

  // f4에서 "이전 단계로"로 돌아왔을 때, 또는 새로고침 후에도 방금 저장했던 조건이 폼에
  // 남아있도록 저장 mutation의 onSuccess가 채워두는 값을 읽어온다. 백엔드에 조회용 GET이
  // 없어서 이 localStorage 캐시가 유일한 사본이다(TanStack Query 인메모리 캐시는
  // 새로고침하면 사라져서 쓸 수 없음).
  const cachedRequirement = dropId
    ? readCache<DesignRequirementResponse>(`design-requirement:${dropId}`)
    : undefined

  const [materialType, setMaterialType] = useState<MaterialType | ''>(
    cachedRequirement?.materialType ?? '',
  )
  const [color, setColor] = useState<MaterialColor | ''>(cachedRequirement?.color ?? '')
  const [pattern, setPattern] = useState<MaterialPattern | ''>(cachedRequirement?.pattern ?? '')
  const [minGrade, setMinGrade] = useState<MaterialGrade | ''>(cachedRequirement?.minGrade ?? '')

  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      if (materialType) formData.append('materialType', materialType)
      if (color) formData.append('color', color)
      if (pattern) formData.append('pattern', pattern)
      if (minGrade) formData.append('minGrade', minGrade)

      return apiFetch<DesignRequirementResponse>(
        `/api/drops/${dropId}/design-requirement`,
        { method: 'POST', body: formData },
      )
    },
    onSuccess: (data) => {
      writeCache(`design-requirement:${dropId}`, data)
      navigate(`/drops/${dropId}/candidates`)
    },
  })

  if (!dropId) {
    return <FormMessage className="p-6">잘못된 접근입니다 (dropId 없음).</FormMessage>
  }

  return (
    <CenteredPage>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>디자인 조건 입력</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-md border border-border p-3.5">
            <h3 className="text-sm font-bold">희망 소재 조건</h3>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="소재 종류" htmlFor="materialType" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                <Select
                  value={materialType}
                  onValueChange={(value) => setMaterialType((value as MaterialType) ?? '')}
                >
                  <SelectTrigger id="materialType" className="w-full">
                    <SelectValue placeholder="선택">
                      {optionLabel(MATERIAL_TYPE_OPTIONS, materialType)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="색상 계열" htmlFor="color" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                <Select value={color} onValueChange={(value) => setColor((value as MaterialColor) ?? '')}>
                  <SelectTrigger id="color" className="w-full">
                    <SelectValue placeholder="선택">{optionLabel(COLOR_OPTIONS, color)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="패턴 선호" htmlFor="pattern" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                <Select value={pattern} onValueChange={(value) => setPattern((value as MaterialPattern) ?? '')}>
                  <SelectTrigger id="pattern" className="w-full">
                    <SelectValue placeholder="선택">{optionLabel(PATTERN_OPTIONS, pattern)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PATTERN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="최소 등급" htmlFor="minGrade" className="[&_label]:text-xs [&_label]:text-muted-foreground">
                <Select value={minGrade} onValueChange={(value) => setMinGrade((value as MaterialGrade) ?? '')}>
                  <SelectTrigger id="minGrade" className="w-full">
                    <SelectValue placeholder="선택">{minGrade || undefined}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MIN_GRADE_OPTIONS.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
          {isError && <FormMessage>저장에 실패했습니다. 다시 시도해주세요.</FormMessage>}
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="secondary" onClick={() => navigate('/drops/new')}>
            이전 단계로
          </Button>
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending ? '저장 중...' : '다음: 소재 후보 추천 받기'}
          </Button>
        </CardFooter>
      </Card>
    </CenteredPage>
  )
}
