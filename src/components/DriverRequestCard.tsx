import { RequestPublication } from '../types/requestPublication';
import { AppButton } from './AppButton';
import { StatusBadge } from './StatusBadge';

interface DriverRequestCardProps {
  req: RequestPublication;
  onAccept?: () => void;
  onReject?: () => void;
  accepting?: boolean;
  rejecting?: boolean;
}

export const DriverRequestCard = ({ req, onAccept, onReject, accepting, rejecting }: DriverRequestCardProps) => (
  <article className="card request-card compact">
    <div className="card-topline">
      <span className="eyebrow">{req.requesterName || `Estudiante UTEC #${req.requesterId}`}</span>
      <StatusBadge status={req.status} />
    </div>
    <div className="meta-grid">
      {req.requesterCareer ? <span>{req.requesterCareer.replace(/_/g, ' ')}</span> : null}
      <span>{req.requesterRating == null ? 'Sin calificación' : `Rating ${req.requesterRating.toFixed(1)}`}</span>
    </div>
    <p>{req.message || 'Sin mensaje.'}</p>
    <div className="meta-grid">
      <span>{req.requesterIsDriver ? 'Solicita conducir' : 'Solicita asiento'}</span>
      <span>{req.seats} asiento(s)</span>
      <span>Destino: {req.pickupPointOrDestine}</span>
    </div>
    {req.status === 'PENDING' ? (
      <div className="card-actions">
        {!req.legacyCountered ? <AppButton loading={accepting} onClick={onAccept}>Aceptar</AppButton> : null}
        <AppButton variant="outline" loading={rejecting} onClick={onReject}>Rechazar</AppButton>
      </div>
    ) : null}
  </article>
);
