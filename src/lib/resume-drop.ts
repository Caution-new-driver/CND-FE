import { apiFetch, ApiError } from '@/lib/api'
import type { AccessorySelectionResponse, MaterialSelectionResponse } from '@/types/candidate'
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

  // 부자재는 선택사항 API라 이 엔드포인트는 하나도 안 골랐어도 404가 아니라 200 + 빈
  // 배열로 응답한다(AccessorySelectionService.getSelections). 그래서 exists()가 아니라
  // 배열 길이로 직접 판단해야 한다 — 안 그러면 부자재를 하나도 안 고른 채 f4를 건너뛴
  // Drop이 "이어서 제작"에서 계속 f4를 건너뛰고 f5/f6으로 직행해버린다.
  const accessorySelections = await apiFetch<AccessorySelectionResponse>(
    `/api/drops/${dropId}/accessory-selections`,
  ).catch(() => null)
  if (!accessorySelections || accessorySelections.selections.length === 0) {
    return `/drops/${dropId}/candidates`
  }

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
