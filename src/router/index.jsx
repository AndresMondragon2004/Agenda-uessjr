import { createBrowserRouter, Navigate } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'
import { PrivateRoute } from './PrivateRoutes'
import { AdminRoute } from './AdminRoutes'
import AdminLayout from '../components/layout/AdminLayout'

import Landing from '../pages/public/Landing'
import Agenda from '../pages/public/Agenda'
import SessionDetail from '../pages/public/SessionDetail'
import Speakers from '../pages/public/Speakers'
import ProposeActivity from '../pages/public/ProposeActivity'
import MyAgenda from '../pages/public/MyAgenda'
import DigitalTicket from '../pages/public/DigitalTicket'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import Terms from '../pages/auth/Terms'
import Privacy from '../pages/auth/Privacy'
import Dashboard from '../pages/admin/Dashboard'
import JornadaManagement from '../pages/admin/JornadaManagement'
import ScenariosManagement from '../pages/admin/ScenariosManagement'
import SessionsManagement from '../pages/admin/SessionsManagement'
import SessionForm from '../pages/admin/SessionForm'
import SessionDetailAdmin from '../pages/admin/SessionDetailAdmin'
import ProposalsManagement from '../pages/admin/ProposalsManagement'
import StudentsManagement from '../pages/admin/StudentsManagement'
import Reports from '../pages/admin/Reports'
import AgendaSimple from '../pages/admin/AgendaSimple'
import AdminsManagement from '../pages/admin/AdminsManagement'
import { SuperAdminRoute } from './AdminRoutes'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/agenda', element: <Agenda /> },
      { path: '/agenda/:id', element: <SessionDetail /> },
      { path: '/conferencistas', element: <Speakers /> },
      { path: '/proponer', element: <ProposeActivity /> },
      { path: '/ticket/:id', element: <DigitalTicket /> },
      {
        path: '/mi-agenda',
        element: (
          <PrivateRoute>
            <MyAgenda />
          </PrivateRoute>
        ),
      },
    ],
  },
  { path: '/login', element: <Login /> },
  { path: '/registro', element: <Register /> },
  { path: '/recuperar-contrasena', element: <ForgotPassword /> },
  { path: '/nueva-contrasena', element: <ResetPassword /> },
  { path: '/terminos', element: <Terms /> },
  { path: '/privacidad', element: <Privacy /> },
  { path: '/admin', element: <Navigate to="/login" replace /> },
  {
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { path: '/admin/dashboard', element: <Dashboard /> },
      { path: '/admin/jornada', element: <JornadaManagement /> },
      { path: '/admin/escenarios', element: <ScenariosManagement /> },
      { path: '/admin/sesiones', element: <SessionsManagement /> },
      { path: '/admin/sesiones/nueva', element: <SessionForm /> },
      { path: '/admin/sesiones/editar/:id', element: <SessionForm /> },
      { path: '/admin/sesiones/:id', element: <SessionDetailAdmin /> },
      { path: '/admin/propuestas', element: <ProposalsManagement /> },
      { path: '/admin/estudiantes', element: <StudentsManagement /> },
      { path: '/admin/reportes', element: <Reports /> },
      { path: '/admin/agenda-simple', element: <AgendaSimple /> },
      { 
        path: '/admin/equipo', 
        element: (
          <SuperAdminRoute>
            <AdminsManagement />
          </SuperAdminRoute>
        ) 
      },
    ],
  },
])
