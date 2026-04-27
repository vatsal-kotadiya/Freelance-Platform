import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, UserRole } from '../store/authStore';

interface Props {
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ requiredRole }: Props) {
  const { token, user } = useAuthStore();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
