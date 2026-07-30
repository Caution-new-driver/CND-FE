import { Routes, Route } from 'react-router-dom'
import { DropStartPage } from '@/pages/DropStart'
import { DesignRequirementPage } from '@/pages/DesignRequirement'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DropStartPage />} />
      <Route path="/drops/:dropId/design-requirement" element={<DesignRequirementPage />} />
    </Routes>
  )
}

export default App
