import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { LoadingState } from '../components/LoadingState';
import { SectionHeader } from '../components/SectionHeader';
import { TripCard } from '../components/TripCard';
import { useAuth } from '../hooks/useAuth';
import { usePublications } from '../hooks/usePublications';
import { useRequests } from '../hooks/useRequests';
import { useRides } from '../hooks/useRides';
import { useVehicles } from '../hooks/useVehicles';
import { formatDateTime, isPast } from '../utils/formatters';
import { usePassengerEligibility } from '../hooks/usePassengerEligibility';

export const DashboardPage = () => {
  const { user, mode, setMode } = useAuth();
  const navigate = useNavigate();
  const { publications, loading: loadingPubs, fetch: fetchPubs } = usePublications();
  const { requests, loading: loadingReqs, fetch: fetchReqs } = useRequests();
  const { myRides, loading: loadingRides, fetch: fetchRides } = useRides(user?.id ?? null);
  const { vehicles, fetch: fetchVehicles } = useVehicles();
  const eligibility = usePassengerEligibility(requests, myRides, user?.id ?? null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchPubs(controller.signal);
    void fetchReqs(controller.signal);
    void fetchRides(controller.signal);
    void fetchVehicles(controller.signal);
    return () => controller.abort();
  }, [fetchPubs, fetchReqs, fetchRides, fetchVehicles]);

  const hasVehicle = vehicles.some((vehicle) => vehicle.ownerId === user?.id);
  const isDriver = mode === 'driver';
  const myActiveReqPubIds = new Set(requests.filter((req) => req.requesterId === user?.id && ['PENDING', 'ACCEPTED'].includes(req.status)).map((req) => req.publicationId));
  const myRidePubIds = new Set(myRides.map((entry) => entry.ride.publicationId));
  const available = publications.filter((pub) =>
    pub.fromUTEC
    && pub.driverToPassenger
    && pub.authorId !== user?.id
    && !myActiveReqPubIds.has(pub.id)
    && !myRidePubIds.has(pub.id)
  );
  const myPublications = publications.filter((pub) => pub.authorId === user?.id);
  const myPending = requests.filter((req) => req.requesterId === user?.id && req.status === 'PENDING');
  const incomingPending = requests.filter((req) => req.status === 'PENDING' && myPublications.some((pub) => pub.id === req.publicationId));
  const driverRides = myRides.filter((entry) => entry.role === 'driver');

  const switchMode = async (next: 'passenger' | 'driver') => {
    if (next === 'driver' && !hasVehicle) {
      if (window.confirm('Para usar el modo conductor primero debes registrar un vehiculo. Ir a vehiculos?')) navigate('/vehicles');
      return;
    }
    await setMode(next);
  };

  if (loadingPubs && loadingReqs && loadingRides) return <LoadingState message="Cargando tu panel..." />;

  const stats = isDriver
    ? [
        { n: incomingPending.length, label: 'Solicitudes' },
        { n: driverRides.length, label: 'Pasajeros confirmados' },
      ]
    : [
        { n: available.length, label: 'Disponibles' },
        { n: myPending.length, label: 'Pendientes' },
      ];

  return (
    <div className="page-stack">
      <section className="page-hero dashboard-hero">
        <div className="hero-identity">
          <Link to="/profile" className="avatar small avatar-link" aria-label="Ir a mi perfil" title="Ir a mi perfil">{user?.name?.[0]}{user?.lastName?.[0]}</Link>
          <div>
            <span className="eyebrow">Tu panel</span>
            <h1>Hola, {user?.name}</h1>
            <p>{user?.career?.replace(/_/g, ' ')} - rating {user?.rating?.toFixed(1) ?? 'sin calificar'}</p>
          </div>
        </div>
        <div className="segmented">
          <button className={!isDriver ? 'active' : ''} onClick={() => void switchMode('passenger')}>Pasajero</button>
          <button className={isDriver ? 'active' : ''} onClick={() => void switchMode('driver')}>Conductor</button>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card metric-card" key={stat.label}>
            <strong>{stat.n}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <SectionHeader title="Acciones rapidas" />
      <section className="action-grid">
        {isDriver ? (
          <>
            <Link className="action-tile" to="/publish-trip"><span className="action-icon">+</span><span>Publicar viaje</span><small>Ofrece asientos disponibles.</small></Link>
            <Link className="action-tile" to="/driver-panel"><span className="action-icon">P</span><span>Panel conductor</span><small>Gestiona solicitudes recibidas.</small></Link>
            <Link className="action-tile" to="/vehicles"><span className="action-icon">V</span><span>Mis vehiculos</span><small>Manten tus datos actualizados.</small></Link>
          </>
        ) : (
          <>
            <Link className="action-tile" to="/search-trips"><span className="action-icon">B</span><span>Buscar viaje</span><small>Encuentra rutas disponibles.</small></Link>
            <Link className="action-tile" to="/requests"><span className="action-icon">S</span><span>Mis solicitudes</span><small>Filtra y revisa tus estados.</small></Link>
          </>
        )}
      </section>

      {myRides.length > 0 ? (
        <section>
          <SectionHeader title="Viajes confirmados" />
          <div className="cards-grid">
            {myRides.map(({ ride, role }) => (
              <article className="card" key={ride.id}>
                <div className="card-topline">
                  <span className="eyebrow">{role === 'driver' ? 'Conductor' : 'Pasajero'}</span>
                  {isPast(ride.departureTime) ? <AppButton variant="outline" onClick={() => navigate(`/review/${ride.id}`)}>Calificar</AppButton> : <span className="status status-accepted">Proximo</span>}
                </div>
                <h3>{ride.destinationOrOrigin}</h3>
                <p>{formatDateTime(ride.departureTime)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!isDriver && !eligibility.hasConfirmedRide && available.length > 0 ? (
        <section>
          <SectionHeader title="Viajes disponibles" action={<Link to="/search-trips">Ver todos</Link>} />
          <div className="cards-grid">
            {available.slice(0, 3).map((pub) => (
              <TripCard key={pub.id} pub={pub} onClick={() => navigate(`/trips/${pub.id}`)} />
            ))}
          </div>
        </section>
      ) : null}

      {!isDriver && eligibility.hasConfirmedRide ? (
        <section className="info-band">
          <strong>Ya tienes un viaje confirmado vigente</strong>
          <span>No mostraremos otros viajes disponibles hasta que pase la hora de salida de tu viaje confirmado.</span>
        </section>
      ) : null}
    </div>
  );
};
