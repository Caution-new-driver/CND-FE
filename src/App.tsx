import { Navigate, Outlet, Routes, Route } from 'react-router-dom'
import { DropStartPage } from '@/pages/DropStart'
import { DesignRequirementPage } from '@/pages/DesignRequirement'
import { MaterialRegistrationPage } from '@/pages/MaterialRegistration'
import { AppHeader } from '@/components/app-header'
import { RequireAuth } from '@/components/require-auth'

function AppLayout() {
  return (
    <RequireAuth>
      <AppHeader />
      <Outlet />
    </RequireAuth>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/materials" replace />} />
        <Route path="/materials" element={<MaterialRegistrationPage />} />
        <Route path="/drops/new" element={<DropStartPage />} />
        <Route path="/drops/:dropId/design-requirement" element={<DesignRequirementPage />} />
      </Route>
    </Routes>
  )
}

export default App
