import { Publication } from '../types/publication';
import { RequestPublication } from '../types/requestPublication';
import { formatDepartureHour } from '../utils/formatters';
import { AppButton } from './AppButton';
import { StatusBadge } from './StatusBadge';

interface RequestCardProps {
  req: RequestPublication;
  publication?: Publication;
  onCancel?: () => void;
  cancelling?: boolean;
}

export const RequestCard = ({ req, publication, onCancel, cancelling }: RequestCardProps) => (
  <article className="card request-card">
    <div className="card-topline">
      <span className="eyebrow">Salida desde UTEC</span>
      <StatusBadge status={req.status} />
    </div>
    <h3>{publication ? publication.destinationOrOrigin : `Publicacion #${req.publicationId}`}</h3>
    {publication ? <p>{formatDepartureHour(publication.departureTime)} · {publication.seats} asiento(s) ofrecidos</p> : null}
    <p>{req.message || 'Sin mensaje.'}</p>
    <div className="meta-grid">
      <span>Solicitaste {req.seats} asiento(s)</span>
      <span>Tu destino: {req.pickupPointOrDestine}</span>
    </div>
    {onCancel ? <div className="card-actions"><AppButton variant="danger" loading={cancelling} onClick={onCancel}>Cancelar</AppButton></div> : null}
  </article>
);
