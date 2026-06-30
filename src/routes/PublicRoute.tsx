import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/LoadingState';

export const PublicRoute = () => {
  const { isAuthenticated, isLoading, pendingVehicleSetup } = useAuth();

  if (isLoading) return <LoadingState message="Restaurando sesion..." />;
  if (isAuthenticated) return <Navigate to={pendingVehicleSetup ? '/setup-vehicle' : '/home'} replace />;

  return <Outlet />;
};
