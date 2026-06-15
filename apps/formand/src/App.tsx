import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PrototypeHub } from './prototypes/PrototypeHub'
import { LoginScreen } from './prototypes/login/LoginScreen'
import { isAuthed } from './utils/storage'

function RequireAuth({ children }: { children: React.ReactElement }) {
  if (!isAuthed()) {
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
