import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type {
  AccessoryColor,
  DesignRequirementResponse,
  MaterialColor,
  MaterialGrade,
  MaterialPattern,
  MaterialType,
} from '@/types/drop'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

const ACCESSORY_COLOR_OPTIONS: { value: AccessoryColor; label: string }[] = [
  { value: 'GOLD', label: '골드' },
  { value: 'SILVER', label: '실버' },
  { value: 'BLACK', label: '블랙' },
]

function optionLabel(options: readonly { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label
}

export function DesignRequirementPage() {
  const { dropId } = useParams<{ dropId: string }>()
  const navigate = useNavigate()

  const [materialType, setMaterialType] = useState<MaterialType | ''>('')
  const [color, setColor] = useState<MaterialColor | ''>('')
  const [pattern, setPattern] = useState<MaterialPattern | ''>('')
  const [minGrade, setMinGrade] = useState<MaterialGrade | ''>('')
  const [accessoryColor, setAccessoryColor] = useState<AccessoryColor | ''>('')
  const [usePointMaterial, setUsePointMaterial] = useState('false')

  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      if (materialType) formData.append('materialType', materialType)
      if (color) formData.append('color', color)
      if (pattern) formData.append('pattern', pattern)
      if (minGrade) formData.append('minGrade', minGrade)
      if (accessoryColor) formData.append('accessoryColor', accessoryColor)
      formData.append('usePointMaterial', usePointMaterial)

      return apiFetch<DesignRequirementResponse>(
        `/api/drops/${dropId}/design-requirement`,
        { method: 'POST', body: formData },
      )
    },
    onSuccess: () => navigate(`/drops/${dropId}/materials`),
  })

  if (!dropId) {
    return <FormMessage className="p-6">잘못된 접근입니다 (dropId 없음).</FormMessage>
  }

  return (
    <CenteredPage>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>디자인 조건 입력</CardTitle>
          <CardDescription>희망하는 소재 조건을 입력해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormField label="희망 소재 종류" htmlFor="materialType">
            <Select
              value={materialType}
              onValueChange={(value) => setMaterialType((value as MaterialType) ?? '')}
            >
              <SelectTrigger id="materialType" className="w-full">
                <SelectValue placeholder="선택">{optionLabel(MATERIAL_TYPE_OPTIONS, materialType)}</SelectValue>
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
          <FormField label="색상 계열" htmlFor="color">
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
          <FormField label="패턴 선호" htmlFor="pattern">
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
          <FormField label="사용 가능 품질 등급" htmlFor="minGrade">
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
          <FormField label="부자재 색상" htmlFor="accessoryColor">
            <Select
              value={accessoryColor}
              onValueChange={(value) => setAccessoryColor((value as AccessoryColor) ?? '')}
            >
              <SelectTrigger id="accessoryColor" className="w-full">
                <SelectValue placeholder="선택">
                  {optionLabel(ACCESSORY_COLOR_OPTIONS, accessoryColor)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ACCESSORY_COLOR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="포인트 소재 사용">
            <Select value={usePointMaterial} onValueChange={(value) => setUsePointMaterial(value ?? 'false')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="선택">
                  {usePointMaterial === 'true' ? '사용' : '미사용'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">사용</SelectItem>
                <SelectItem value="false">미사용</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {isError && <FormMessage>저장에 실패했습니다. 다시 시도해주세요.</FormMessage>}
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending ? '저장 중...' : '다음'}
          </Button>
        </CardFooter>
      </Card>
    </CenteredPage>
  )
}
