import type { ProductionScenarioItemResponse } from '@/types/production'

export interface PatternPiece {
  pieceName: string
  widthMm: number
  heightMm: number
  quantity: number
}

export interface AccessoryRequirement {
  accessoryType: string
  quantity: number
}

export interface DropResponse {
  id: string
  status: string
  // b13 확정 시점에 채워짐. 확정 전(DRAFT)에는 null.
  name: string | null
  introText: string | null
  expectedProductionDays: number | null
  createdAt: string
  regenerationsRemaining: number
  templateId: string
  templateName: string
  patternPieces: PatternPiece[]
  requiredAccessories: AccessoryRequirement[]
}

export interface TemplateResponse {
  templateId: string
  templateName: string
  patternPieces: PatternPiece[]
  requiredAccessories: AccessoryRequirement[]
}

export type MaterialType = 'LEATHER' | 'COATED_CANVAS' | 'FABRIC' | 'SYNTHETIC' | 'OTHER'
export type MaterialColor = 'BLACK' | 'BROWN' | 'BEIGE' | 'WHITE' | 'RED' | 'BLUE' | 'MULTI' | 'OTHER'
export type MaterialPattern = 'MONOGRAM' | 'SOLID' | 'GEOMETRIC' | 'STRIPE' | 'OTHER'
export type MaterialGrade = 'A' | 'B' | 'C'
export type AccessoryColor = 'GOLD' | 'SILVER' | 'BLACK'

export interface DesignRequirementResponse {
  id: string
  dropId: string
  materialType: MaterialType | null
  color: MaterialColor | null
  pattern: MaterialPattern | null
  minGrade: MaterialGrade | null
}

// PATCH /api/drops/{dropId}/confirm 요청 (b13)
export interface DropConfirmRequest {
  name: string
  expectedProductionDays: number
}

// PATCH /api/drops/{dropId}/confirm 응답 (b13) — introText는 b14가 확정 흐름에 흡수되어
// 함께 생성되지만, AI 생성이 실패하면 null일 수 있음(담당자가 직접 채워야 함).
export interface DropConfirmResponse {
  id: string
  status: string
  name: string
  expectedProductionDays: number
  selectedScenarioId: string
  items: ProductionScenarioItemResponse[]
  introText: string | null
  regenerationsRemaining: number
}

// POST /api/drops/{dropId}/intro-text 응답 (b14, AI 재생성)
export interface DropIntroTextResponse {
  dropId: string
  introText: string
  regenerationsRemaining: number
}

// PATCH /api/drops/{dropId}/intro-text 요청 (b14, 담당자가 고친 최종본 저장)
export interface DropIntroTextRequest {
  introText: string
}
