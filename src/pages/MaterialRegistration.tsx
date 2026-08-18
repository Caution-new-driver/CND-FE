import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { MaterialAiTagResult, MaterialResponse } from '@/types/material'
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
import { FlowFrame } from '@/components/ui/flow-frame'
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()

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

  // 등록된 소재 목록 수정 모드 — x 버튼으로 실제 DELETE 호출
  const [isEditingList, setIsEditingList] = useState(false)

  // 소재 상세 오버레이 카드 — 목록에서 클릭한 소재
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialResponse | null>(null)

  const materialsQuery = useQuery({
    queryKey: ['materials'],
    queryFn: () => apiFetch<MaterialResponse[]>('/api/materials'),
    enabled: isAuthenticated,
  })

  // 삭제(DELETE /api/materials/{id}) — 성공하면 204 No Content, 목록 다시 불러옴
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/materials/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })

  // AI 태깅 미리보기(POST /api/materials/ai-tag-preview) — 소재를 등록하기 전,
  // 사진을 올리자마자 호출한다. 소재를 저장하지 않고 태깅 결과만 받아온다.
  const previewMutation = useMutation({
    mutationFn: ({ full, closeup }: { full: File; closeup: File | null }) => {
      const formData = new FormData()
      formData.append('imageFull', full)
      if (closeup) formData.append('imageCloseup', closeup)
      return apiFetch<MaterialAiTagResult>('/api/materials/ai-tag-preview', {
        method: 'POST',
        body: formData,
      })
    },
  })

  // 등록 직후 AI 필드를 확정하는 mutation. 미리보기 결과가 이미 있으면 그 값을 그대로
  // PATCH로 반영해서(OpenAI 재호출 없음) 붙이고, 없으면(미리보기가 실패했거나 아직 안 끝났으면)
  // 예전처럼 POST /api/materials/{id}/ai-tag로 새로 태깅한다.
  // 이게 실패해도 소재는 이미 저장돼 있으므로 등록 실패로 취급하지 않는다.
  const finalizeTagMutation = useMutation({
    mutationFn: ({ materialId, preview }: { materialId: string; preview: MaterialAiTagResult | null }) => {
      if (!preview) {
        return apiFetch<MaterialResponse>(`/api/materials/${materialId}/ai-tag`, { method: 'POST' })
      }
      const formData = new FormData()
      formData.append('color', preview.color)
      formData.append('pattern', preview.pattern)
      formData.append('texture', preview.texture)
      formData.append('aiConfidence', String(preview.aiConfidence))
      formData.append('surfaceNotes', preview.surfaceNotes)
      return apiFetch<MaterialResponse>(`/api/materials/${materialId}`, {
        method: 'PATCH',
        body: formData,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })

  // 등록(POST /api/materials) — 성공하면 바로 draft를 비우고(중복 등록 방지),
  // 이어서 AI 태깅 확정을 별도로 요청한다.
  const createMutation = useMutation({
    mutationFn: () => {
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

      return apiFetch<MaterialResponse>('/api/materials', {
        method: 'POST',
        body: formData,
      })
    },
    onSuccess: (material) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })

      // 등록 시점에 이미 받아둔 AI 미리보기 결과를 그대로 넘긴다 (없으면 finalizeTagMutation이 알아서 새로 태깅).
      const preview = previewMutation.data ?? null

      // 등록은 이미 끝났으니 AI 태깅 성공 여부와 무관하게 draft부터 비운다.
      if (imageFullPreview) URL.revokeObjectURL(imageFullPreview)
      if (imageCloseupPreview) URL.revokeObjectURL(imageCloseupPreview)
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
      previewMutation.reset()

      finalizeTagMutation.mutate({ materialId: material.id, preview })
    },
  })

  const handleImageFullSelect = (file: File) => {
    if (imageFullPreview) URL.revokeObjectURL(imageFullPreview)
    setImageFull(file)
    setImageFullPreview(URL.createObjectURL(file))
    previewMutation.mutate({ full: file, closeup: imageCloseup })
  }

  const handleImageCloseupSelect = (file: File) => {
    if (imageCloseupPreview) URL.revokeObjectURL(imageCloseupPreview)
    setImageCloseup(file)
    setImageCloseupPreview(URL.createObjectURL(file))
    if (imageFull) previewMutation.mutate({ full: imageFull, closeup: file })
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

  const materials = materialsQuery.data ?? []

  const handleRemoveMaterial = (id: string) => {
    deleteMutation.mutate(id)
  }

  return (
    <CenteredPage>
      <FlowFrame activeStep={1}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>소재 등록 &amp; AI 태깅 확인</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
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
            {previewMutation.isPending || finalizeTagMutation.isPending ? (
              <p className="flex items-center gap-1 py-2 text-[11.5px] text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> AI 분석 중...
              </p>
            ) : previewMutation.data ? (
              <>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg border border-input px-2.5 py-1.5 text-[12px]">
                    {MATERIAL_COLOR_LABEL[previewMutation.data.color]}
                  </div>
                  <div className="flex-1 rounded-lg border border-input px-2.5 py-1.5 text-[12px]">
                    {MATERIAL_PATTERN_LABEL[previewMutation.data.pattern]}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-lg border border-input px-2.5 py-1.5 text-[12px]">
                    {previewMutation.data.texture || '-'}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-[11px] text-muted-foreground">신뢰도</span>
                    <Badge variant="secondary" className="w-fit">
                      {formatConfidence(previewMutation.data.aiConfidence)}
                    </Badge>
                  </div>
                </div>
                {previewMutation.data.surfaceNotes && (
                  <p className="text-[11px] text-muted-foreground">
                    특이사항: {previewMutation.data.surfaceNotes}
                  </p>
                )}
              </>
            ) : (
              <p className="py-2 text-[11.5px] text-muted-foreground">
                소재 사진을 업로드하면 AI 태깅 결과가 여기 표시됩니다.
              </p>
            )}
            {previewMutation.isError && (
              <FormMessage>AI 분석에 실패했습니다. 사진을 다시 업로드해주세요.</FormMessage>
            )}
            {finalizeTagMutation.isError && (
              <FormMessage>
                AI 분석에 실패했습니다. 소재는 이미 등록되었으니, 필요하면 목록에서 다시 시도해주세요.
              </FormMessage>
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
                  <SelectValue placeholder="소재 종류">
                    {MATERIAL_TYPE_LABEL[materialType as keyof typeof MATERIAL_TYPE_LABEL]}
                  </SelectValue>
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
                  <SelectValue placeholder="등급">{grade ? `${grade}등급` : undefined}</SelectValue>
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
              onClick={() => createMutation.mutate()}
              disabled={!canRegister || createMutation.isPending}
            >
              {createMutation.isPending ? '등록 중...' : '소재 등록'}
            </Button>
            {createMutation.isError && (
              <FormMessage>등록에 실패했습니다. 다시 시도해주세요.</FormMessage>
            )}
          </PanelSection>
          </div>

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
            {deleteMutation.isError && (
              <FormMessage>삭제에 실패했습니다. 다시 시도해주세요.</FormMessage>
            )}
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
                            disabled={deleteMutation.isPending}
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
          <Button disabled={materials.length === 0} onClick={() => navigate('/drops/new')}>
            다음: Drop 기획 시작
          </Button>
        </CardFooter>
      </Card>
      </FlowFrame>
    </CenteredPage>
  )
}
