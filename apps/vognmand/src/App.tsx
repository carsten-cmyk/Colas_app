import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { VognmandShell } from '@/prototypes/VognmandShell'
import { VognmandGanttScreen } from '@/prototypes/gantt/VognmandGanttScreen'
import { VognmandListeScreen } from '@/prototypes/liste/VognmandListeScreen'
import { VognmandDisponeringsScreen } from '@/prototypes/disponering/VognmandDisponeringsScreen'
import { VognmandKoerselScreen } from '@/prototypes/koersel/VognmandKoerselScreen'
import { DataudvekslingScreen } from '@/prototypes/dataudveksling/DataudvekslingScreen'
import { LoginScreen } from '@/prototypes/login/LoginScreen'

function RequireAuth({ children }: { children: React.ReactElement }) {
  if (!sessionStorage.getItem('vognmand_auth')) {
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
            <Routes>
              <Route element={<VognmandShell />}>
                <Route path="liste" element={<VognmandListeScreen />} />
                <Route path="gantt" element={<VognmandGanttScreen />} />
                <Route path="dataudveksling" element={<DataudvekslingScreen />} />
                <Route path="koersel/:ordreId" element={<VognmandKoerselScreen />} />
                <Route path="arkiv" element={<div className="p-md"><h1 className="font-poppins font-semibold text-2xl text-text-primary">Ordre arkiv</h1><p className="font-inter text-sm text-text-muted mt-xs">Kommer snart.</p></div>} />
              </Route>
              <Route path="disponering/:ordreId" element={<VognmandDisponeringsScreen />} />
              <Route path="*" element={<Navigate to="liste" replace />} />
            </Routes>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
