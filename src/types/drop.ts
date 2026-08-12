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
  accessoryColor: AccessoryColor | null
  usePointMaterial: boolean | null
}
