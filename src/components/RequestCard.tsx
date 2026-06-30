import { RequestPublication } from '../types/requestPublication';
import { AppButton } from './AppButton';
import { StatusBadge } from './StatusBadge';

interface RequestCardProps {
  req: RequestPublication;
  onCancel?: () => void;
  cancelling?: boolean;
}

export const RequestCard = ({ req, onCancel, cancelling }: RequestCardProps) => (
  <article className="card request-card">
    <div className="card-topline">
      <span className="eyebrow">{req.requesterIsDriver ? 'Solicitud como conductor' : 'Solicitud de asiento'}</span>
      <StatusBadge status={req.status} />
    </div>
    <h3>Publicacion #{req.publicationId}</h3>
    <p>{req.message || 'Sin mensaje.'}</p>
    <div className="meta-grid">
      <span>{req.seats} asiento(s)</span>
      <span>{req.pickupPointOrDestine}</span>
    </div>
    {onCancel ? <div className="card-actions"><AppButton variant="danger" loading={cancelling} onClick={onCancel}>Cancelar</AppButton></div> : null}
  </article>
);
