import { RequestStatus } from '../types/requestPublication';

const labels: Record<RequestStatus, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
};

export const StatusBadge = ({ status }: { status: RequestStatus }) => (
  <span className={`status status-${status.toLowerCase()}`}>{labels[status]}</span>
);
