// Stage 3 추천(b9~b11, 박서준 담당) 백엔드가 아직 없어서(CLAUDE.md 기준 미착수) 필드명은 잠정치입니다.
// 실제 API 스펙이 나오면 맞춰서 수정 필요.

export interface MaterialCandidateResponse {
  id: string
  materialId: string
  materialCode: string
  label: string
  imageUrl: string | null
  matchScore: number // 0~100
}
