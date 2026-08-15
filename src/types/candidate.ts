// CND-BE domain/matching, domain/material 기준 (참고만 함, 이 파일은 FE 전용)
import type {
  MaterialColor,
  MaterialGrade,
  MaterialPattern,
  MaterialResponse,
  MaterialType,
} from '@/types/material'
import type { AccessoryColor } from '@/types/drop'

export interface MaterialCandidateMaterialDetail {
  id: string
  materialCode: string
  materialType: MaterialType
  color: MaterialColor
  pattern: MaterialPattern
  grade: MaterialGrade
  widthMm: number
  heightMm: number
  quantity: number
  imageUrlFull: string | null
  imageUrlCloseup: string | null
}

export interface MaterialCandidateResponse {
  candidateId: string
  rank: number
  matchScore: number
  aiReasons: string | null
  aiCautions: string | null
  material: MaterialCandidateMaterialDetail
}

// GET/POST /api/drops/{dropId}/material-candidates 공통 응답 (배열이 아니라 객체로 감싸져 옴)
export interface MaterialCandidateListResponse {
  dropId: string
  candidates: MaterialCandidateResponse[]
}

// POST /api/drops/{dropId}/material-selection 요청
export interface MaterialSelectionRequest {
  mainCandidateId: string
  pointCandidateId: string | null
}

export interface MaterialSelectionResponse {
  selectionId: string
  dropId: string
  mainMaterial: MaterialResponse
  pointMaterial: MaterialResponse | null
}

// GET /api/accessories 응답
export interface AccessoryResponse {
  id: string
  accessoryType: string
  color: AccessoryColor
}

// POST /api/drops/{dropId}/accessory-selections 요청
export interface AccessorySelectionRequest {
  accessoryIds: string[]
}

export interface AccessorySelectionResponse {
  dropId: string
  selections: {
    selectionId: string
    accessoryId: string
    accessoryType: string
    color: AccessoryColor
  }[]
}
