import { Link, useLocation } from 'react-router-dom';

const labels: Record<string, string> = {
  home: 'Inicio',
  'search-trips': 'Buscar viajes',
  trips: 'Detalle',
  'publish-trip': 'Publicar viaje',
  requests: 'Mis solicitudes',
  'driver-panel': 'Panel conductor',
  vehicles: 'Vehiculos',
  profiles: 'Perfiles',
  profile: 'Perfil',
  review: 'Calificar',
  'setup-vehicle': 'Configurar vehiculo',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Ubicacion">
      <Link to="/home">Carpool UTEC</Link>
      {parts.map((part, index) => {
        const path = `/${parts.slice(0, index + 1).join('/')}`;
        const isLast = index === parts.length - 1;
        const label = labels[part] ?? part;
        return (
          <span key={path}>
            <span>/</span>
            {isLast ? <strong>{label}</strong> : <Link to={path}>{label}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
