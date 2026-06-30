import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CompassPage } from './pages/CompassPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/compass" replace />} />
        <Route path="/compass" element={<CompassPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
