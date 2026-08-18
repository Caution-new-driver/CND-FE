import { useEffect } from 'react'
import { Navigate, Outlet, Routes, Route, useLocation } from 'react-router-dom'
import { DropStartPage } from '@/pages/DropStart'
import { DesignRequirementPage } from '@/pages/DesignRequirement'
import { DropConfirmPage } from '@/pages/DropConfirm'
import { DropListPage } from '@/pages/DropList'
import { MaterialCandidatesPage } from '@/pages/MaterialCandidates'
import { MaterialRegistrationPage } from '@/pages/MaterialRegistration'
import { ProductionScenarioPage } from '@/pages/ProductionScenario'
import { AppHeader } from '@/components/app-header'
import { RequireAuth } from '@/components/require-auth'

// "다음"/"이전" 등으로 f1~f6 사이를 이동할 때 이전 화면에서 스크롤해둔 위치가 그대로
// 남아있지 않도록, 경로가 바뀔 때마다 항상 맨 위에서부터 보이게 한다.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AppLayout() {
  return (
    <RequireAuth>
      <ScrollToTop />
      <AppHeader />
      <Outlet />
    </RequireAuth>
  )
}

// Figma 흐름 순서: f1 소재 등록 -> f2 Drop 시작 -> f3 디자인 조건 -> f4 AI 추천 후보
// -> f6 제작 결과 비교 -> f7·f8 Drop 확정·소개문
function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/materials" replace />} />
        <Route path="/materials" element={<MaterialRegistrationPage />} />
        <Route path="/drops" element={<DropListPage />} />
        <Route path="/drops/new" element={<DropStartPage />} />
        <Route path="/drops/:dropId/design-requirement" element={<DesignRequirementPage />} />
        <Route path="/drops/:dropId/candidates" element={<MaterialCandidatesPage />} />
        <Route path="/drops/:dropId/production-scenario" element={<ProductionScenarioPage />} />
        <Route path="/drops/:dropId/confirm" element={<DropConfirmPage />} />
      </Route>
    </Routes>
  )
}

export default App
