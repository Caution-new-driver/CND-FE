import type {
  MaterialColor,
  MaterialGrade,
  MaterialPattern,
  MaterialStatus,
  MaterialType,
} from '@/types/material'

export const MATERIAL_TYPE_LABEL: Record<MaterialType, string> = {
  LEATHER: '가죽',
  COATED_CANVAS: '코팅 원단',
  FABRIC: '원단',
  SYNTHETIC: '합성피혁',
  OTHER: '기타',
}

export const MATERIAL_TYPE_OPTIONS = Object.keys(MATERIAL_TYPE_LABEL) as MaterialType[]

export const MATERIAL_COLOR_LABEL: Record<MaterialColor, string> = {
  BLACK: '블랙',
  BROWN: '브라운',
  BEIGE: '베이지',
  WHITE: '화이트',
  RED: '레드',
  BLUE: '블루',
  MULTI: '멀티',
  OTHER: '기타',
}

export const MATERIAL_PATTERN_LABEL: Record<MaterialPattern, string> = {
  MONOGRAM: '모노그램',
  SOLID: '무지',
  GEOMETRIC: '기하학',
  STRIPE: '스트라이프',
  OTHER: '기타',
}

export const MATERIAL_GRADE_OPTIONS: MaterialGrade[] = ['A', 'B', 'C']

export const MATERIAL_STATUS_LABEL: Record<MaterialStatus, string> = {
  AVAILABLE: '사용 가능',
  RESERVED: '예약됨',
  DEPLETED: '소진됨',
}
