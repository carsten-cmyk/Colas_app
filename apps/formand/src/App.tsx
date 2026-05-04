import { Routes, Route, Navigate } from 'react-router-dom'
import { PrototypeHub } from './prototypes/PrototypeHub'

export default function App() {
  return (
    <Routes>
      {/* TODO: Erstat med rigtige sider når klar */}
      <Route path="/" element={<Navigate to="/prototyper" replace />} />
      <Route path="/prototyper/*" element={<PrototypeHub />} />
    </Routes>
  )
}
