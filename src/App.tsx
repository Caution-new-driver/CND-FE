import { Navigate, Routes, Route } from 'react-router-dom'
import { DropStartPage } from '@/pages/DropStart'
import { DesignRequirementPage } from '@/pages/DesignRequirement'
<<<<<<< HEAD
import { MaterialCandidatesPage } from '@/pages/MaterialCandidates'
=======
import { MaterialRegistrationPage } from '@/pages/MaterialRegistration'
>>>>>>> origin/dev

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/materials" replace />} />
      <Route path="/materials" element={<MaterialRegistrationPage />} />
      <Route path="/drops/new" element={<DropStartPage />} />
      <Route path="/drops/:dropId/design-requirement" element={<DesignRequirementPage />} />
      <Route path="/drops/:dropId/candidates" element={<MaterialCandidatesPage />} />
    </Routes>
  )
}

export default App
