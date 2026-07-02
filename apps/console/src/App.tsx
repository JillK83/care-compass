import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ClientsListPage } from './pages/ClientsListPage'
import { DignityProfilePage } from './pages/DignityProfilePage'
import { CaregiverProfilePage } from './pages/CaregiverProfilePage'
import { loadCrosswalk } from 'utils'

function App() {
  useEffect(() => {
    fetch('/assets/zip-county-crosswalk.csv')
      .then(r => r.text())
      .then(text => {
        const rows = text.trim().split('\n').slice(1).map(line => {
          const [zip, county_fips] = line.split(',')
          return { zip, county_fips }
        })
        loadCrosswalk(rows)
      })
      .catch(() => { /* non-fatal — ZIP lookup returns null until loaded */ })
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <ClientsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/new"
            element={
              <ProtectedRoute>
                <DignityProfilePage mode="create" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:id/edit"
            element={
              <ProtectedRoute>
                <DignityProfilePage mode="edit" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute>
                <DignityProfilePage mode="view" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caregivers/new"
            element={
              <ProtectedRoute>
                <CaregiverProfilePage mode="create" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caregivers/:id/edit"
            element={
              <ProtectedRoute>
                <CaregiverProfilePage mode="edit" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caregivers/:id"
            element={
              <ProtectedRoute>
                <CaregiverProfilePage mode="view" />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
