import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AuthGuard({ children, requiredRole }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== 'admin' && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}