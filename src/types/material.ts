// CND-BE domain/material 기준 (참고만 함, 이 파일은 FE 전용)
export type MaterialType = 'LEATHER' | 'COATED_CANVAS' | 'FABRIC' | 'SYNTHETIC' | 'OTHER'
export type MaterialColor = 'BLACK' | 'BROWN' | 'BEIGE' | 'WHITE' | 'RED' | 'BLUE' | 'MULTI' | 'OTHER'
export type MaterialPattern = 'MONOGRAM' | 'SOLID' | 'GEOMETRIC' | 'STRIPE' | 'OTHER'
export type MaterialGrade = 'A' | 'B' | 'C'
export type MaterialStatus = 'AVAILABLE' | 'RESERVED' | 'DEPLETED'

export interface MaterialResponse {
  id: string
  materialCode: string | null
  materialType: MaterialType

  // AI가 채우는 값 (등록 직후에는 전부 null, ai-tag 호출 후 채워짐)
  color: MaterialColor | null
  pattern: MaterialPattern | null
  texture: string | null
  aiConfidence: number | null
  surfaceNotes: string | null

  // 담당자가 직접 입력하는 값
  grade: MaterialGrade | null
  widthMm: number | null
  heightMm: number | null
  thicknessMm: number | null
  handFeel: string | null
  flexibility: string | null
  quantity: number | null

  imageUrlFull: string | null
  imageUrlCloseup: string | null

  status: MaterialStatus
  createdAt: string
  updatedAt: string
}
