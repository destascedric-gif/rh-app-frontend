import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './Layout'
import Login from './pages/Login'
import SetupAdmin from './pages/SetupAdmin'
import SetupCompany from './pages/SetupCompany'
import AcceptInvite from './pages/AcceptInvite'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import EmployeeList from './pages/EmployeeList'
import EmployeeDetail from './pages/EmployeeDetail'
import EmployeeForm from './pages/EmployeeForm'
import AdminLeaves from './pages/AdminLeaves'
import MyLeaves from './pages/MyLeaves'
import MySpace from './pages/MySpace'
import AdminSchedule from './pages/AdminSchedule'
import MySchedule from './pages/MySchedule'
import AdminPayroll from './pages/AdminPayroll'
import InviteEmployee from './pages/InviteEmployee'
import MyTimesheet from './pages/MyTimesheet'
import Settings from './pages/Settings'
import Billing from './pages/Billing'
import Landing from './pages/Landing'
import MentionsLegales from './pages/legal/MentionsLegales'
import Cgu from './pages/legal/Cgu'
import Cgv from './pages/legal/Cgv'
import Confidentialite from './pages/legal/Confidentialite'
import Dpa from './pages/legal/Dpa'
import Pilotage from './pages/pilotage/Pilotage'
import PilotageLayout from './pages/pilotage/PilotageLayout'
import PilEntreprises from './pages/pilotage/PilEntreprises'
import PilEntreprise from './pages/pilotage/PilEntreprise'
import PilFormules from './pages/pilotage/PilFormules'
import PilJournal from './pages/pilotage/PilJournal'
import PilSante from './pages/pilotage/PilSante'
import OwnerSetup from './pages/pilotage/OwnerSetup'

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  if (loading) return <div>Chargement…</div>
  if (!user) return <Navigate to="/login" />
  // Le propriétaire d'Orgaly n'a pas d'entreprise : seul le pilotage le concerne
  if (user.role === 'owner') return <Navigate to="/pilotage" />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/mon-espace" />
  return <Layout>{children}</Layout>
}

// Page de pilotage : propriétaire d'Orgaly uniquement (vérifié aussi par le serveur)
const OwnerRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div>Chargement…</div>
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'owner') return <Navigate to="/" />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup/admin" element={<SetupAdmin />} />
          <Route path="/setup/company" element={<SetupCompany />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />
          {/* Documents légaux : publics, accessibles sans compte */}
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/cgu" element={<Cgu />} />
          <Route path="/cgv" element={<Cgv />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="/dpa" element={<Dpa />} />
          {/* Pilotage : tableau de bord et pages de détail, menu commun */}
          <Route path="/pilotage" element={<OwnerRoute><PilotageLayout /></OwnerRoute>}>
            <Route index element={<Pilotage />} />
            <Route path="entreprises" element={<PilEntreprises />} />
            <Route path="entreprises/:id" element={<PilEntreprise />} />
            <Route path="formules" element={<PilFormules />} />
            <Route path="journal" element={<PilJournal />} />
            <Route path="sante" element={<PilSante />} />
          </Route>
          <Route path="/proprietaire/activer" element={<OwnerSetup />} />
          <Route path="/dashboard" element={<PrivateRoute adminOnly><Dashboard /></PrivateRoute>} />
          <Route path="/employees" element={<PrivateRoute adminOnly><EmployeeList /></PrivateRoute>} />
          <Route path="/employees/:id" element={<PrivateRoute adminOnly><EmployeeDetail /></PrivateRoute>} />
          <Route path="/employees/:id/edit" element={<PrivateRoute adminOnly><EmployeeForm /></PrivateRoute>} />
          <Route path="/invite" element={<PrivateRoute adminOnly><InviteEmployee /></PrivateRoute>} />
          <Route path="/admin/leaves" element={<PrivateRoute adminOnly><AdminLeaves /></PrivateRoute>} />
          <Route path="/admin/schedule" element={<PrivateRoute adminOnly><AdminSchedule /></PrivateRoute>} />
          <Route path="/admin/payroll" element={<PrivateRoute adminOnly><AdminPayroll /></PrivateRoute>} />
          <Route path="/parametres" element={<PrivateRoute adminOnly><Settings /></PrivateRoute>} />
          <Route path="/abonnement" element={<PrivateRoute adminOnly><Billing /></PrivateRoute>} />
          <Route path="/mon-espace" element={<PrivateRoute><MySpace /></PrivateRoute>} />
          <Route path="/mes-conges" element={<PrivateRoute><MyLeaves /></PrivateRoute>} />
          <Route path="/mon-planning" element={<PrivateRoute><MySchedule /></PrivateRoute>} />
          <Route path="/mon-pointage" element={<PrivateRoute><MyTimesheet /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App