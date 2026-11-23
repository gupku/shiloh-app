import { Navigate, Route, Routes } from 'react-router-dom'
import type { Role } from '../shared/types.ts'
import Layout from './components/Layout.tsx'
import StatusScreen from './components/StatusScreen.tsx'
import Login from './pages/Login.tsx'
import { useApp } from './store.tsx'

import Assign from './pages/volunteer/Assign.tsx'
import Assigned from './pages/volunteer/Assigned.tsx'
import AssignedDetails from './pages/volunteer/AssignedDetails.tsx'
import CountryDetails from './pages/volunteer/CountryDetails.tsx'
import VolunteerDashboard from './pages/volunteer/Dashboard.tsx'

import Audit from './pages/admin/Audit.tsx'
import AdminDashboard from './pages/admin/Dashboard.tsx'
import Hostels from './pages/admin/Hostels.tsx'
import Rules from './pages/admin/Rules.tsx'
import Volunteers from './pages/admin/Volunteers.tsx'

// Only lets signed-in users of the right role see a portal
function Portal({ role }: { role: Role }) {
  const { session, status } = useApp()
  if (status !== 'ready') return <StatusScreen />
  if (session?.role !== role) return <Navigate to={`/${role}/login`} replace />
  return <Layout role={role} />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/volunteer/login" replace />} />
      <Route path="/volunteer/login" element={<Login key="volunteer" role="volunteer" />} />
      <Route path="/admin/login" element={<Login key="admin" role="admin" />} />

      <Route path="/volunteer" element={<Portal role="volunteer" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<VolunteerDashboard />} />
        <Route path="assign" element={<Assign />} />
        <Route path="assign/:id" element={<CountryDetails />} />
        <Route path="assigned" element={<Assigned />} />
        <Route path="assigned/:id" element={<AssignedDetails />} />
      </Route>

      <Route path="/admin" element={<Portal role="admin" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="hostels" element={<Hostels />} />
        <Route path="volunteers" element={<Volunteers />} />
        <Route path="rules" element={<Rules />} />
        <Route path="audit" element={<Audit />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
