import { Navigate, Routes, Route } from 'react-router-dom'
import { DropStartPage } from '@/pages/DropStart'
import { DesignRequirementPage } from '@/pages/DesignRequirement'
import { MaterialRegistrationPage } from '@/pages/MaterialRegistration'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/materials" replace />} />
      <Route path="/materials" element={<MaterialRegistrationPage />} />
      <Route path="/drops/new" element={<DropStartPage />} />
      <Route path="/drops/:dropId/design-requirement" element={<DesignRequirementPage />} />
    </Routes>
  )
}

export default App
