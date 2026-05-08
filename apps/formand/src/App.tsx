import { Routes, Route, Navigate } from 'react-router-dom'
import { PrototypeHub } from './prototypes/PrototypeHub'
import { LoginScreen } from './prototypes/login/LoginScreen'

export default function App() {
  return (
    <Routes>
      {/* TODO: Erstat med rigtig auth når klar */}
      <Route path="/" element={<LoginScreen />} />
      <Route path="/prototyper/*" element={<PrototypeHub />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
