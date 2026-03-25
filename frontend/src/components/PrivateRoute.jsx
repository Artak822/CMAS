import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, staffOnly = false }) {
  const { token, isStaff } = useAuth()

  if (!token) return <Navigate to="/login" replace />
  if (staffOnly && !isStaff) return <Navigate to="/dashboard" replace />

  return children
}
