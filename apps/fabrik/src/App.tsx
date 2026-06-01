import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginScreen } from './prototypes/login/LoginScreen'
import { ProduktionsplanScreen } from './prototypes/produktionsplan/ProduktionsplanScreen'

function RequireAuth({ children }: { children: React.ReactElement }) {
  if (!sessionStorage.getItem('fabrik_auth')) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route
        path="/produktionsplan"
        element={
          <RequireAuth>
            <ProduktionsplanScreen />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
