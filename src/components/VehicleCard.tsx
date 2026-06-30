import { Vehicle } from '../types/vehicle';
import { AppButton } from './AppButton';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

export const VehicleCard = ({ vehicle, onEdit, onDelete, deleting }: VehicleCardProps) => (
  <article className="card vehicle-card">
    <div>
      <span className="plate">{vehicle.plate}</span>
      <h3>{vehicle.brand} {vehicle.model}</h3>
      <p>{vehicle.color} · {vehicle.seats} asiento(s)</p>
    </div>
    <div className="card-actions">
      {onEdit ? <AppButton variant="outline" onClick={onEdit}>Editar</AppButton> : null}
      {onDelete ? <AppButton variant="danger" loading={deleting} onClick={onDelete}>Eliminar</AppButton> : null}
    </div>
  </article>
);
