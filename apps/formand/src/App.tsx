import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PrototypeHub } from './prototypes/PrototypeHub'
import { LoginScreen } from './prototypes/login/LoginScreen'

function RequireAuth({ children }: { children: React.ReactElement }) {
  if (!sessionStorage.getItem('formand_auth')) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route
        path="/prototyper/*"
        element={
          <RequireAuth>
            <PrototypeHub />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
