import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/LoadingState';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, pendingVehicleSetup } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingState message="Restaurando sesion..." />;
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location }} />;
  if (pendingVehicleSetup && !['/setup-vehicle', '/vehicles'].includes(location.pathname)) {
    return <Navigate to="/setup-vehicle" replace />;
  }

  return <Outlet />;
};
