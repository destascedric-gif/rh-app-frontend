import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './Layout'
import Login from './pages/Login'
import SetupAdmin from './pages/SetupAdmin'
import SetupCompany from './pages/SetupCompany'
import AcceptInvite from './pages/AcceptInvite'
import EmployeeList from './pages/EmployeeList'
import EmployeeDetail from './pages/EmployeeDetail'
import AdminLeaves from './pages/AdminLeaves'
import MyLeaves from './pages/MyLeaves'
import AdminSchedule from './pages/AdminSchedule'
import MySchedule from './pages/MySchedule'
import AdminPayroll from './pages/AdminPayroll'
import InviteEmployee from './pages/InviteEmployee'

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  if (loading) return <div>Chargement…</div>
  if (!user) return <Navigate to="/login" />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/mon-espace" />
  return <Layout>{children}</Layout>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup/admin" element={<SetupAdmin />} />
          <Route path="/setup/company" element={<SetupCompany />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/dashboard" element={<PrivateRoute adminOnly><EmployeeList /></PrivateRoute>} />
          <Route path="/employees" element={<PrivateRoute adminOnly><EmployeeList /></PrivateRoute>} />
          <Route path="/employees/:id" element={<PrivateRoute adminOnly><EmployeeDetail /></PrivateRoute>} />
          <Route path="/invite" element={<PrivateRoute adminOnly><InviteEmployee /></PrivateRoute>} />
          <Route path="/admin/leaves" element={<PrivateRoute adminOnly><AdminLeaves /></PrivateRoute>} />
          <Route path="/admin/schedule" element={<PrivateRoute adminOnly><AdminSchedule /></PrivateRoute>} />
          <Route path="/admin/payroll" element={<PrivateRoute adminOnly><AdminPayroll /></PrivateRoute>} />
          <Route path="/mon-espace" element={<PrivateRoute><MyLeaves /></PrivateRoute>} />
          <Route path="/mon-planning" element={<PrivateRoute><MySchedule /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App