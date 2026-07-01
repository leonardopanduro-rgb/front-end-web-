import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Protege acciones exclusivas de conductor (publicar viaje, panel de solicitudes).
 * Si el usuario esta en modo pasajero, lo devuelve al inicio.
 */
export const DriverRoute = () => {
  const { mode } = useAuth();
  if (mode !== 'driver') return <Navigate to="/home" replace />;
  return <Outlet />;
};
