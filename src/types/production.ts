// CND-BE domain/production 기준 (참고만 함, 이 파일은 FE 전용)
export type ScenarioType = 'MAIN_ONLY' | 'WITH_LUGGAGE_TAG'
export type ProductType = 'MINI_BAG' | 'LUGGAGE_TAG'
export type MaterialRole = 'MAIN' | 'POINT'

export interface RemainingRegionResponse {
  widthMm: number
  heightMm: number
}

export interface ProductionScenarioItemResponse {
  productType: ProductType
  quantity: number
  numberingStart: number | null
  numberingEnd: number | null
}

export interface ProductionMaterialResultResponse {
  materialId: string
  materialCode: string
  materialRole: MaterialRole
  supportedMiniBagQuantity: number
  luggageTagQuantity: number
  availableAreaMm2: number
  usedAreaMm2: number
  remainingAreaMm2: number
  remainingRegions: RemainingRegionResponse[]
}

export interface ProductionScenarioResponse {
  scenarioId: string
  scenarioType: ScenarioType
  // 0~100 사이 퍼센트 값 (0~1 소수 아님, BE ProductionScenarioCalculator 기준)
  materialUtilizationRate: number
  totalAvailableAreaMm2: number
  usedAreaMm2: number
  remainingAreaMm2: number
  selected: boolean
  items: ProductionScenarioItemResponse[]
  materialResults: ProductionMaterialResultResponse[]
}

// GET/POST /api/drops/{dropId}/production-scenarios, POST .../{scenarioId}/select 공통 응답
export interface ProductionScenarioListResponse {
  dropId: string
  selectedScenarioId: string | null
  scenarios: ProductionScenarioResponse[]
}
