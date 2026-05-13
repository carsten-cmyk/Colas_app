import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginScreen } from './prototypes/chauffeur/screens/LoginScreen'
import { DemoPage } from './prototypes/chauffeur/DemoPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/app" element={<DemoPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
