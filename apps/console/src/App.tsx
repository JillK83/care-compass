import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConsolePage } from './pages/ConsolePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<ConsolePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
