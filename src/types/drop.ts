export interface PatternPiece {
  pieceName: string
  widthCm: number
  heightCm: number
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

export interface DesignRequirementResponse {
  id: string
  dropId: string
  materialType: string | null
  color: string | null
  pattern: string | null
  minGrade: string | null
  accessoryColor: string | null
  usePointMaterial: boolean | null
  sketchImageUrl: string | null
}
