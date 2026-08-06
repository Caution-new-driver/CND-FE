import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { MaterialResponse } from '@/types/material'
import {
  MATERIAL_COLOR_LABEL,
  MATERIAL_GRADE_OPTIONS,
  MATERIAL_PATTERN_LABEL,
  MATERIAL_STATUS_LABEL,
  MATERIAL_TYPE_LABEL,
  MATERIAL_TYPE_OPTIONS,
} from '@/lib/material-options'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CenteredPage } from '@/components/ui/centered-page'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormMessage } from '@/components/ui/form-message'
import { ImageDropSlot } from '@/components/ui/image-drop-slot'
import { Input } from '@/components/ui/input'
import { PanelSection } from '@/components/ui/panel-section'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// aiConfidence가 0~1(비율)로 오는지 0~100(퍼센트)으로 오는지 스펙상 불명확해서 둘 다 대응
function formatConfidence(value: number | null) {
  if (value == null) return '-'
  const pct = value <= 1 ? value * 100 : value
  return `${Math.round(pct)}%`
}

// 오버레이 카드에서 보여줄 소재의 전체 필드 목록 (label, value)
function buildDetailRows(material: MaterialResponse): Array<[string, string]> {
  return [
    ['소재 코드', material.materialCode ?? '-'],
    ['소재 종류', MATERIAL_TYPE_LABEL[material.materialType]],
    ['상태', MATERIAL_STATUS_LABEL[material.status]],
    ['색상 (AI)', material.color ? MATERIAL_COLOR_LABEL[material.color] : '-'],
    ['패턴 (AI)', material.pattern ? MATERIAL_PATTERN_LABEL[material.pattern] : '-'],
    ['질감 (AI)', material.texture || '-'],
    ['AI 신뢰도', formatConfidence(material.aiConfidence)],
    ['특이사항 (AI)', material.surfaceNotes || '-'],
    ['등급', material.grade ? `${material.grade}등급` : '-'],
    ['두께', material.thicknessMm != null ? `${material.thicknessMm}mm` : '-'],
    ['촉감', material.handFeel || '-'],
    ['유연성', material.flexibility || '-'],
    ['수량', material.quantity != null ? `${material.quantity}개` : '-'],
    ['가로', material.widthMm != null ? `${material.widthMm}mm` : '-'],
    ['세로', material.heightMm != null ? `${material.heightMm}mm` : '-'],
    ['등록일', new Date(material.createdAt).toLocaleString('ko-KR')],
    ['수정일', new Date(material.updatedAt).toLocaleString('ko-KR')],
  ]
}

export function MaterialRegistrationPage() {
  const { dropId } = useParams<{ dropId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 소재 사진 — 백엔드가 imageFull(전체샷, 필수) / imageCloseup(클로즈업, 선택) 2슬롯만 받음.
  // 등록 전까지는 이 둘이 하나의 소재 draft로 취급된다. 전체샷이 대표 이미지 역할.
  const [imageFull, setImageFull] = useState<File | null>(null)
  const [imageFullPreview, setImageFullPreview] = useState<string | null>(null)
  const [imageCloseup, setImageCloseup] = useState<File | null>(null)
  const [imageCloseupPreview, setImageCloseupPreview] = useState<string | null>(null)

  // 담당자 직접 입력
  const [materialCode, setMaterialCode] = useState('')
  const [materialType, setMaterialType] = useState('')
  const [grade, setGrade] = useState('')
  const [widthMm, setWidthMm] = useState('')
  const [heightMm, setHeightMm] = useState('')
  const [thicknessMm, setThicknessMm] = useState('')
  const [handFeel, setHandFeel] = useState('')
  const [flexibility, setFlexibility] = useState('')
  const [quantity, setQuantity] = useState('')

  // 방금 등록 + AI 태깅까지 끝난 소재 (AI 태깅 결과 섹션에 표시)
  const [lastTagged, setLastTagged] = useState<MaterialResponse | null>(null)

  // 등록된 소재 목록 수정 모드 — 백엔드 삭제 API 없이 화면에서만 숨김 처리
  const [isEditingList, setIsEditingList] = useState(false)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  // 소재 상세 오버레이 카드 — 목록에서 클릭한 소재
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialResponse | null>(null)

  const materialsQuery = useQuery({
    queryKey: ['materials'],
    queryFn: () => apiFetch<MaterialResponse[]>('/api/materials'),
  })

  // 등록(POST /api/materials) -> 성공하면 바로 AI 태깅(POST /api/materials/{id}/ai-tag) 순서로 체이닝
  const registerMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('materialCode', materialCode)
      formData.append('materialType', materialType)
      formData.append('grade', grade)
      formData.append('widthMm', widthMm)
      formData.append('heightMm', heightMm)
      formData.append('thicknessMm', thicknessMm)
      formData.append('handFeel', handFeel)
      formData.append('flexibility', flexibility)
      formData.append('quantity', quantity)
      if (imageFull) formData.append('imageFull', imageFull)
      if (imageCloseup) formData.append('imageCloseup', imageCloseup)

      const created = await apiFetch<MaterialResponse>('/api/materials', {
        method: 'POST',
        body: formData,
      })

      return apiFetch<MaterialResponse>(`/api/materials/${created.id}/ai-tag`, {
        method: 'POST',
      })
    },
    onSuccess: (material) => {
      setLastTagged(material)
      queryClient.invalidateQueries({ queryKey: ['materials'] })

      // 다음 소재를 위해 draft 초기화
      setImageFull(null)
      setImageFullPreview(null)
      setImageCloseup(null)
      setImageCloseupPreview(null)
      setMaterialCode('')
      setMaterialType('')
      setGrade('')
      setWidthMm('')
      setHeightMm('')
      setThicknessMm('')
      setHandFeel('')
      setFlexibility('')
      setQuantity('')
    },
  })

  if (!dropId) {
    return <FormMessage className="p-6">잘못된 접근입니다 (dropId 없음).</FormMessage>
  }

  const handleImageFullSelect = (file: File) => {
    setImageFull(file)
    setImageFullPreview(URL.createObjectURL(file))
  }

  const handleImageCloseupSelect = (file: File) => {
    setImageCloseup(file)
    setImageCloseupPreview(URL.createObjectURL(file))
  }

  const canRegister =
    !!imageFull &&
    materialCode.trim() !== '' &&
    materialType !== '' &&
    grade !== '' &&
    widthMm.trim() !== '' &&
    heightMm.trim() !== '' &&
    thicknessMm.trim() !== '' &&
    handFeel.trim() !== '' &&
    flexibility.trim() !== '' &&
    quantity.trim() !== ''

  const materials = (materialsQuery.data ?? []).filter((material) => !removedIds.has(material.id))

  const handleRemoveMaterial = (id: string) => {
    setRemovedIds((prev) => new Set(prev).add(id))
  }

  return (
    <CenteredPage>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>소재 등록 &amp; AI 태깅 확인</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PanelSection title="소재 사진 업로드">
            {!imageFull ? (
              <ImageDropSlot
                preview={null}
                onSelect={handleImageFullSelect}
                className="h-24 w-full"
                placeholder={
                  <>
                    <ImagePlus className="size-5 text-muted-foreground" />
                    <span className="text-[12.5px] leading-tight text-muted-foreground">
                      사진 업로드 후
                      <br />
                      AI 분석 시작
                    </span>
                  </>
                }
              />
            ) : (
              <div className="flex flex-wrap items-start gap-3">
                <ImageDropSlot
                  preview={imageFullPreview}
                  badgeLabel="전체샷"
                  onSelect={handleImageFullSelect}
                  className="size-24"
                  placeholder={<ImagePlus className="size-5 text-muted-foreground" />}
                />
                <ImageDropSlot
                  preview={imageCloseupPreview}
                  badgeLabel="클로즈업"
                  onSelect={handleImageCloseupSelect}
                  className="size-24"
                  placeholder={
                    <>
                      <ImagePlus className="size-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">클로즈업 (선택)</span>
                    </>
                  }
                />
              </div>
            )}
          </PanelSection>

          <PanelSection title="AI 태깅 결과" titleExtra={<Badge variant="secondary">AI 자동</Badge>}>
            {registerMutation.isPending ? (
              <p className="flex items-center gap-1 py-2 text-[11.5px] text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> 등록 및 AI 분석 중...
              </p>
            ) : lastTagged ? (
              <>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg border border-input px-2.5 py-1.5 text-[12px]">
                    {lastTagged.color ? MATERIAL_COLOR_LABEL[lastTagged.color] : '-'}
                  </div>
                  <div className="flex-1 rounded-lg border border-input px-2.5 py-1.5 text-[12px]">
                    {lastTagged.pattern ? MATERIAL_PATTERN_LABEL[lastTagged.pattern] : '-'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-lg border border-input px-2.5 py-1.5 text-[12px]">
                    {lastTagged.texture || '-'}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-[11px] text-muted-foreground">신뢰도</span>
                    <Badge variant="secondary" className="w-fit">
                      {formatConfidence(lastTagged.aiConfidence)}
                    </Badge>
                  </div>
                </div>
                {lastTagged.surfaceNotes && (
                  <p className="text-[11px] text-muted-foreground">특이사항: {lastTagged.surfaceNotes}</p>
                )}
              </>
            ) : (
              <p className="py-2 text-[11.5px] text-muted-foreground">
                소재를 등록하면 AI 태깅 결과가 여기 표시됩니다.
              </p>
            )}
            {registerMutation.isError && (
              <FormMessage>등록/AI 분석에 실패했습니다. 다시 시도해주세요.</FormMessage>
            )}
          </PanelSection>

          <PanelSection title="담당자 직접 입력">
            <div className="grid grid-cols-3 gap-3">
              <Input
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                placeholder="소재 코드 (예: LTH-003)"
                className="col-span-3"
              />
              <Select value={materialType} onValueChange={(value) => setMaterialType(value ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="소재 종류" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {MATERIAL_TYPE_LABEL[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={grade} onValueChange={(value) => setGrade(value ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="등급" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_GRADE_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}등급
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="수량"
              />
              <Input
                type="number"
                min={0}
                step="0.1"
                value={widthMm}
                onChange={(e) => setWidthMm(e.target.value)}
                placeholder="가로 (mm)"
              />
              <Input
                type="number"
                min={0}
                step="0.1"
                value={heightMm}
                onChange={(e) => setHeightMm(e.target.value)}
                placeholder="세로 (mm)"
              />
              <Input
                type="number"
                min={0}
                step="0.1"
                value={thicknessMm}
                onChange={(e) => setThicknessMm(e.target.value)}
                placeholder="두께 (mm)"
              />
              <Input
                value={handFeel}
                onChange={(e) => setHandFeel(e.target.value)}
                placeholder="촉감 (예: 부드러움)"
              />
              <Input
                value={flexibility}
                onChange={(e) => setFlexibility(e.target.value)}
                placeholder="유연성 (예: 보통)"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="self-end"
              onClick={() => registerMutation.mutate()}
              disabled={!canRegister || registerMutation.isPending}
            >
              {registerMutation.isPending ? '등록 중...' : '소재 등록'}
            </Button>
          </PanelSection>

          <PanelSection
            title="등록된 소재 목록"
            action={
              materials.length > 0 && (
                <Button size="xs" variant="outline" onClick={() => setIsEditingList((prev) => !prev)}>
                  {isEditingList ? '수정 완료' : '수정'}
                </Button>
              )
            }
          >
            {materialsQuery.isLoading ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">불러오는 중...</p>
            ) : materials.length === 0 ? (
              <p className="py-2 text-[11.5px] text-muted-foreground">등록된 소재가 없습니다.</p>
            ) : (
              <ul className="flex flex-col">
                {materials.map((material, index) => (
                  <li
                    key={material.id}
                    onClick={() => setSelectedMaterial(material)}
                    className={`flex cursor-pointer items-center gap-3 py-2 text-[11.5px] hover:bg-muted/50 ${
                      index > 0 ? 'border-t border-border' : ''
                    }`}
                  >
                    {material.imageUrlFull && (
                      <img
                        src={material.imageUrlFull}
                        alt=""
                        className="size-10 shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-bold">{MATERIAL_TYPE_LABEL[material.materialType]}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {material.quantity != null ? `수량 ${material.quantity}` : '-'}
                        </span>
                        {isEditingList && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveMaterial(material.id)
                            }}
                            aria-label="목록에서 제거"
                            className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>
        </CardContent>

        <Dialog
          open={selectedMaterial !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedMaterial(null)
          }}
        >
          <DialogContent className="max-w-md">
            {selectedMaterial && (
              <>
                <DialogHeader>
                  <DialogTitle>{MATERIAL_TYPE_LABEL[selectedMaterial.materialType]}</DialogTitle>
                  <DialogDescription>등록된 소재 상세 정보</DialogDescription>
                </DialogHeader>
                {(selectedMaterial.imageUrlFull || selectedMaterial.imageUrlCloseup) && (
                  <div className="flex gap-3">
                    {selectedMaterial.imageUrlFull && (
                      <img
                        src={selectedMaterial.imageUrlFull}
                        alt="전체샷"
                        className="size-20 rounded border border-input object-cover"
                      />
                    )}
                    {selectedMaterial.imageUrlCloseup && (
                      <img
                        src={selectedMaterial.imageUrlCloseup}
                        alt="클로즈업"
                        className="size-20 rounded border border-input object-cover"
                      />
                    )}
                  </div>
                )}
                <dl className="flex max-h-80 flex-col overflow-y-auto">
                  {buildDetailRows(selectedMaterial).map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-t border-border py-1.5 first:border-t-0"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </DialogContent>
        </Dialog>
        <CardFooter className="justify-end">
          {/* TODO: 다음 단계(Drop 기획) 라우트가 만들어지면 경로 연결 */}
          <Button disabled={materials.length === 0} onClick={() => navigate(`/drops/${dropId}/plan`)}>
            다음: Drop 기획 시작
          </Button>
        </CardFooter>
      </Card>
    </CenteredPage>
  )
}
