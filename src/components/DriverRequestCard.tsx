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
      <span className="eyebrow">Estudiante UTEC #{req.requesterId}</span>
      <StatusBadge status={req.status} />
    </div>
    <p>{req.message || 'Sin mensaje.'}</p>
    <div className="meta-grid">
      <span>{req.requesterIsDriver ? 'Solicita conducir' : 'Solicita asiento'}</span>
      <span>{req.seats} asiento(s)</span>
      <span>{req.pickupPointOrDestine}</span>
    </div>
    {req.status === 'PENDING' ? (
      <div className="card-actions">
        <AppButton loading={accepting} onClick={onAccept}>Aceptar</AppButton>
        <AppButton variant="outline" loading={rejecting} onClick={onReject}>Rechazar</AppButton>
      </div>
    ) : null}
  </article>
);
