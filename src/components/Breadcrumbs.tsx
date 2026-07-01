import { Link, useLocation } from 'react-router-dom';

const labels: Record<string, string> = {
  home: 'Inicio',
  'search-trips': 'Buscar viajes',
  trips: 'Detalle del viaje',
  'publish-trip': 'Publicar viaje',
  requests: 'Mis solicitudes',
  'driver-panel': 'Panel conductor',
  vehicles: 'Vehiculos',
  profiles: 'Perfiles',
  profile: 'Perfil',
  review: 'Calificar',
  'setup-vehicle': 'Configurar vehiculo',
};

// Segmentos que corresponden a una ruta navegable real (pueden ser enlaces).
// 'trips' y 'review' solo existen con un :id, por eso no se enlazan.
const LINKABLE = new Set([
  'home', 'search-trips', 'publish-trip', 'requests',
  'driver-panel', 'vehicles', 'profiles', 'profile', 'setup-vehicle',
]);

export const Breadcrumbs = () => {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  // Los segmentos numericos (ids) no son una pagina propia: se omiten como migaja.
  const crumbs = parts
    .map((part, index) => ({ part, path: `/${parts.slice(0, index + 1).join('/')}` }))
    .filter((crumb) => !/^\d+$/.test(crumb.part));
  if (crumbs.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Ubicacion">
      <Link to="/home">Carpool UTEC</Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const label = labels[crumb.part] ?? crumb.part;
        const canLink = !isLast && LINKABLE.has(crumb.part);
        return (
          <span key={crumb.path}>
            <span>/</span>
            {canLink ? <Link to={crumb.path}>{label}</Link> : <strong>{label}</strong>}
          </span>
        );
      })}
    </nav>
  );
};
