import { useState } from 'react'
import { useParams } from 'react-router-dom'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function DesignRequirementPage() {
  const { dropId } = useParams<{ dropId: string }>()

  const [materialType, setMaterialType] = useState('')
  const [color, setColor] = useState('')
  const [pattern, setPattern] = useState('')
  const [minGrade, setMinGrade] = useState('')
  const [accessoryColor, setAccessoryColor] = useState('')
  const [usePointMaterial, setUsePointMaterial] = useState('false')
  const [sketchImage, setSketchImage] = useState<File | null>(null)

  const { mutate, data, isPending, isError, isSuccess } = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      if (materialType) formData.append('materialType', materialType)
      if (color) formData.append('color', color)
      if (pattern) formData.append('pattern', pattern)
      if (minGrade) formData.append('minGrade', minGrade)
      if (accessoryColor) formData.append('accessoryColor', accessoryColor)
      formData.append('usePointMaterial', usePointMaterial)
      if (sketchImage) formData.append('sketchImage', sketchImage)

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
            <Input
              id="materialType"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              placeholder="예: 가죽"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="color">색상 계열</Label>
            <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="예: 블랙" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pattern">패턴 선호</Label>
            <Input id="pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="예: 무지" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minGrade">사용 가능 품질 등급</Label>
            <Input
              id="minGrade"
              value={minGrade}
              onChange={(e) => setMinGrade(e.target.value)}
              placeholder="예: A"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accessoryColor">부자재 색상</Label>
            <Input
              id="accessoryColor"
              value={accessoryColor}
              onChange={(e) => setAccessoryColor(e.target.value)}
              placeholder="예: 골드"
            />
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sketchImage">스케치 이미지 (선택)</Label>
            <input
              id="sketchImage"
              type="file"
              accept="image/*"
              onChange={(e) => setSketchImage(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>
          {isError && (
            <p className="text-sm text-destructive">저장에 실패했습니다. 다시 시도해주세요.</p>
          )}
          {isSuccess && data && (
            <p className="text-sm text-primary">
              저장 완료{data.sketchImageUrl ? ' (스케치 이미지 업로드됨)' : ''}
            </p>
          )}
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
