import { Publication } from '../types/publication';
import { formatDepartureHour, formatDistance } from '../utils/formatters';

interface TripCardProps {
  pub: Publication;
  statusBadge?: string;
  onClick?: () => void;
}

export const TripCard = ({ pub, statusBadge, onClick }: TripCardProps) => (
  <button className="card trip-card clickable" onClick={onClick}>
    <div className="card-topline">
      <span className="eyebrow">Salida desde UTEC</span>
      {statusBadge ? <span className="status status-pending">{statusBadge}</span> : null}
    </div>
    <h3>{pub.titulo}</h3>
    <p>{pub.descripcion || 'Sin descripcion adicional.'}</p>
    <div className="meta-grid">
      <span>Ofrece asientos</span>
      <span>{pub.destinationOrOrigin}</span>
      <span>{formatDepartureHour(pub.departureTime)}</span>
      <span>{pub.seats} asiento(s)</span>
      {pub.distanceToUtecKm != null ? <span>{formatDistance(pub.distanceToUtecKm)}</span> : null}
    </div>
  </button>
);
