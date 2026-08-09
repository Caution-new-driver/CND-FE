import { useState } from 'react'
import { useParams } from 'react-router-dom'
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
import { Label } from '@/components/ui/label'
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

  const [materialType, setMaterialType] = useState<MaterialType | ''>('')
  const [color, setColor] = useState<MaterialColor | ''>('')
  const [pattern, setPattern] = useState<MaterialPattern | ''>('')
  const [minGrade, setMinGrade] = useState<MaterialGrade | ''>('')
  const [accessoryColor, setAccessoryColor] = useState<AccessoryColor | ''>('')
  const [usePointMaterial, setUsePointMaterial] = useState('false')

  const { mutate, data, isPending, isError, isSuccess } = useMutation({
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
  })

  if (!dropId) {
    return <p className="p-6 text-sm text-destructive">잘못된 접근입니다 (dropId 없음).</p>
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>디자인 조건 입력</CardTitle>
          <CardDescription>희망하는 소재 조건을 입력해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="materialType">희망 소재 종류</Label>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="color">색상 계열</Label>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pattern">패턴 선호</Label>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minGrade">사용 가능 품질 등급</Label>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accessoryColor">부자재 색상</Label>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>포인트 소재 사용</Label>
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
          </div>
          {isError && (
            <p className="text-sm text-destructive">저장에 실패했습니다. 다시 시도해주세요.</p>
          )}
          {isSuccess && data && <p className="text-sm text-primary">저장 완료</p>}
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending ? '저장 중...' : '다음'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
