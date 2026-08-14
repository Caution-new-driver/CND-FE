import { Navigate, Routes, Route } from 'react-router-dom'
import { DropStartPage } from '@/pages/DropStart'
import { DesignRequirementPage } from '@/pages/DesignRequirement'
import { MaterialCandidatesPage } from '@/pages/MaterialCandidates'
import { MaterialRegistrationPage } from '@/pages/MaterialRegistration'
import { ProductionScenarioPage } from '@/pages/ProductionScenario'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/materials" replace />} />
      <Route path="/materials" element={<MaterialRegistrationPage />} />
      <Route path="/drops/new" element={<DropStartPage />} />
      <Route path="/drops/:dropId/design-requirement" element={<DesignRequirementPage />} />
      <Route path="/drops/:dropId/candidates" element={<MaterialCandidatesPage />} />
      <Route path="/drops/:dropId/production-scenario" element={<ProductionScenarioPage />} />
    </Routes>
  )
}

export default App
