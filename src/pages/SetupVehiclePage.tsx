import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { useAuth } from '../hooks/useAuth';
import { useVehicles } from '../hooks/useVehicles';

export const SetupVehiclePage = () => {
  const { user, setMode, setPendingVehicleSetup } = useAuth();
  const { vehicles, fetch } = useVehicles();
  const navigate = useNavigate();
  const hasVehicle = vehicles.some((vehicle) => vehicle.ownerId === user?.id);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(controller.signal);
    return () => controller.abort();
  }, [fetch]);

  const finish = async (mode: 'driver' | 'passenger') => {
    await setMode(mode);
    setPendingVehicleSetup(false);
    navigate('/home');
  };

  return (
    <section className="center-card">
      <h1>Bienvenido, {user?.name}</h1>
      <p>Registra tu vehiculo para activar el modo conductor. Tambien puedes omitir este paso y entrar como pasajero.</p>
      {hasVehicle ? <div className="alert alert-success">Vehiculo registrado</div> : null}
      <div className="stack-actions">
        {hasVehicle ? (
          <AppButton onClick={() => void finish('driver')}>Entrar como conductor</AppButton>
        ) : (
          <AppButton onClick={() => navigate('/vehicles')}>Registrar mi vehiculo</AppButton>
        )}
        <AppButton variant="outline" onClick={() => void finish('passenger')}>{hasVehicle ? 'Entrar como pasajero' : 'Omitir por ahora'}</AppButton>
      </div>
    </section>
  );
};
