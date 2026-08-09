import { Routes, Route } from 'react-router-dom'
import { DropStartPage } from '@/pages/DropStart'
import { DesignRequirementPage } from '@/pages/DesignRequirement'
import { MaterialRegistrationPage } from '@/pages/MaterialRegistration'

function App() {
  return (
    <Routes>
      <Route path="/drops/new" element={<DropStartPage />} />
      <Route path="/drops/:dropId/design-requirement" element={<DesignRequirementPage />} />
      <Route path="/drops/:dropId/materials" element={<MaterialRegistrationPage />} />
    </Routes>
  )
}

export default App
