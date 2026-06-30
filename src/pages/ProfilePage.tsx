import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { LoadingState } from '../components/LoadingState';
import { VehicleCard } from '../components/VehicleCard';
import { useAuth } from '../hooks/useAuth';
import { useVehicles } from '../hooks/useVehicles';
import { formatRating } from '../utils/formatters';

export const ProfilePage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { vehicles, loading, fetch } = useVehicles();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    void refreshUser();
    void fetch();
  }, [refreshUser, fetch]);

  if (!user) return <LoadingState />;

  const myVehicles = vehicles.filter((vehicle) => vehicle.ownerId === user.id);

  const handleLogout = async () => {
    if (!window.confirm('Seguro que quieres cerrar sesion?')) return;
    setLoggingOut(true);
    await logout();
    navigate('/');
  };

  return (
    <div className="page-stack">
      <section className="profile-header">
        <div className="avatar">{user.name[0]}{user.lastName[0]}</div>
        <div>
          <h1>{user.name} {user.lastName}</h1>
          <p>{user.email}</p>
          <strong>{formatRating(user.rating)}</strong>
        </div>
      </section>
      <section className="card">
        <dl className="info-list">
          <div><dt>Codigo</dt><dd>{user.studentCode}</dd></div>
          <div><dt>Carrera</dt><dd>{user.career.replace(/_/g, ' ')}</dd></div>
          <div><dt>Ciclo</dt><dd>{user.cycle}</dd></div>
          <div><dt>Telefono</dt><dd>{user.phone}</dd></div>
          <div><dt>Rol</dt><dd>{user.role}</dd></div>
        </dl>
      </section>
      <section className="info-band">
        <strong>Modo de uso flexible</strong>
        <span>Puedes ser pasajero o conductor segun el viaje.</span>
      </section>
      <section className="page-stack">
        <div className="section-header">
          <h2>Mis vehiculos</h2>
          <AppButton variant="outline" onClick={() => navigate('/vehicles')}>Gestionar</AppButton>
        </div>
        {loading ? <LoadingState message="Cargando vehiculos..." /> : myVehicles.length === 0 ? (
          <AppButton variant="outline" onClick={() => navigate('/vehicles')}>Registrar vehiculo</AppButton>
        ) : (
          <div className="cards-grid">
            {myVehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onEdit={() => navigate('/vehicles')} />)}
          </div>
        )}
      </section>
      <AppButton variant="danger" loading={loggingOut} onClick={() => void handleLogout()}>Cerrar sesion</AppButton>
    </div>
  );
};
