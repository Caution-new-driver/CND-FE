import { apiFetch, ApiError } from '@/lib/api'
import type { MaterialSelectionResponse } from '@/types/candidate'
import type { ProductionScenarioListResponse } from '@/types/production'

// "이어서 제작" 버튼이 DRAFT Drop을 어느 단계로 되돌려보낼지 판단한다.
// f3(디자인 조건) -> f4(소재 추천) -> f5(제작 결과) -> f6(Drop 확정) 순서로,
// 아직 저장된 적 없는 가장 앞 단계를 찾아 그 화면의 경로를 반환한다.
export async function resolveResumePath(dropId: string): Promise<string> {
  const hasDesignRequirement = await exists(() =>
    apiFetch(`/api/drops/${dropId}/design-requirement`),
  )
  if (!hasDesignRequirement) return `/drops/${dropId}/design-requirement`

  const hasMaterialSelection = await exists(() =>
    apiFetch<MaterialSelectionResponse>(`/api/drops/${dropId}/material-selection`),
  )
  if (!hasMaterialSelection) return `/drops/${dropId}/candidates`

  const scenarios = await apiFetch<ProductionScenarioListResponse>(
    `/api/drops/${dropId}/production-scenarios`,
  ).catch(() => null)
  const hasSelectedScenario = scenarios?.scenarios.some((scenario) => scenario.selected) ?? false

  return hasSelectedScenario
    ? `/drops/${dropId}/confirm`
    : `/drops/${dropId}/production-scenario`
}

async function exists(fetcher: () => Promise<unknown>): Promise<boolean> {
  try {
    await fetcher()
    return true
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return false
    throw error
  }
}
