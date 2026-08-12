import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { DesignRequirementResponse } from '@/types/drop'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function DesignRequirementPage() {
  const { dropId } = useParams<{ dropId: string }>()
  const navigate = useNavigate()

  const [materialType, setMaterialType] = useState('')
  const [color, setColor] = useState('')
  const [pattern, setPattern] = useState('')
  const [minGrade, setMinGrade] = useState('')
  const [accessoryColor, setAccessoryColor] = useState('')
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
            <Input
              id="materialType"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              placeholder="예: 가죽"
            />
          </FormField>
          <FormField label="색상 계열" htmlFor="color">
            <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="예: 블랙" />
          </FormField>
          <FormField label="패턴 선호" htmlFor="pattern">
            <Input id="pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="예: 무지" />
          </FormField>
          <FormField label="사용 가능 품질 등급" htmlFor="minGrade">
            <Input
              id="minGrade"
              value={minGrade}
              onChange={(e) => setMinGrade(e.target.value)}
              placeholder="예: A"
            />
          </FormField>
          <FormField label="부자재 색상" htmlFor="accessoryColor">
            <Input
              id="accessoryColor"
              value={accessoryColor}
              onChange={(e) => setAccessoryColor(e.target.value)}
              placeholder="예: 골드"
            />
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
