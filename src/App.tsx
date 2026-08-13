import { Routes, Route } from 'react-router-dom'
import { DropStartPage } from '@/pages/DropStart'
import { DesignRequirementPage } from '@/pages/DesignRequirement'
import { MaterialCandidatesPage } from '@/pages/MaterialCandidates'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DropStartPage />} />
      <Route path="/drops/:dropId/design-requirement" element={<DesignRequirementPage />} />
      <Route path="/drops/:dropId/candidates" element={<MaterialCandidatesPage />} />
    </Routes>
  )
}

export default App
