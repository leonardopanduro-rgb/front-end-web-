import { FormEvent, useEffect, useState } from 'react';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingState } from '../components/LoadingState';
import { Modal } from '../components/Modal';
import { VehicleCard } from '../components/VehicleCard';
import { useAuth } from '../hooks/useAuth';
import { useUiFeedback } from '../hooks/useUiFeedback';
import { useVehicles } from '../hooks/useVehicles';
import { vehicleService } from '../services/vehicle';
import { Vehicle, VehicleRequest } from '../types/vehicle';
import { parseAxiosError } from '../utils/errorMessages';

const blank = { plate: '', brand: '', model: '', color: '', seats: '' };

export const VehiclePage = () => {
  const { user } = useAuth();
  const { confirm, notify } = useUiFeedback();
  const { vehicles, loading, error, fetch } = useVehicles();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(blank);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(controller.signal);
    return () => controller.abort();
  }, [fetch]);

  const myVehicles = vehicles.filter((vehicle) => vehicle.ownerId === user?.id);
  const set = (key: keyof typeof blank, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setFormErrors({});
    setMessage('');
    setOpen(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditing(vehicle);
    setForm({ plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model, color: vehicle.color, seats: String(vehicle.seats) });
    setFormErrors({});
    setMessage('');
    setOpen(true);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.plate.trim()) next.plate = 'Requerido';
    if (!form.brand.trim()) next.brand = 'Requerido';
    if (!form.model.trim()) next.model = 'Requerido';
    if (!form.color.trim()) next.color = 'Requerido';
    const seats = Number.parseInt(form.seats, 10);
    if (!Number.isInteger(seats) || seats <= 0) next.seats = 'Debe ser mayor a 0';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!validate()) return;
    setSaving(true);
    const data: VehicleRequest = {
      plate: form.plate.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      color: form.color.trim(),
      seats: Number.parseInt(form.seats, 10),
    };
    try {
      if (editing) await vehicleService.update(editing.id, data);
      else await vehicleService.create(data);
      setOpen(false);
      await fetch();
    } catch (err) {
      setMessage(parseAxiosError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Eliminar vehiculo', message: 'Seguro que quieres eliminar este vehiculo?', confirmLabel: 'Eliminar', danger: true });
    if (!ok) return;
    setDeleting(id);
    try {
      await vehicleService.remove(id);
      await fetch();
      notify('Vehiculo eliminado.', 'success');
    } catch (err) {
      notify(parseAxiosError(err).message, 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>Mis vehiculos</h1>
          <p>Registra los autos que puedes usar para publicar o aceptar viajes como conductor.</p>
        </div>
      </section>
      {loading ? <LoadingState /> : error ? <ErrorMessage error={error} onRetry={fetch} /> : myVehicles.length === 0 ? (
        <EmptyState title="Sin vehiculos registrados" subtitle="Agrega tu auto para publicar como conductor" ctaLabel="Registrar vehiculo" onCta={openCreate} />
      ) : (
        <div className="cards-grid">
          {myVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onEdit={() => openEdit(vehicle)} onDelete={() => void handleDelete(vehicle.id)} deleting={deleting === vehicle.id} />
          ))}
        </div>
      )}

      <Modal open={open} title={editing ? 'Editar vehiculo' : 'Nuevo vehiculo'} onClose={() => setOpen(false)}>
        <form className="modal-form" onSubmit={handleSubmit}>
          {message ? <div className="alert alert-error">{message}</div> : null}
          <div className="form-grid two">
            <AppInput label="Placa" value={form.plate} onChange={(e) => set('plate', e.target.value)} error={formErrors.plate} />
            <AppInput label="Marca" value={form.brand} onChange={(e) => set('brand', e.target.value)} error={formErrors.brand} />
            <AppInput label="Modelo" value={form.model} onChange={(e) => set('model', e.target.value)} error={formErrors.model} />
            <AppInput label="Color" value={form.color} onChange={(e) => set('color', e.target.value)} error={formErrors.color} />
            <AppInput label="Asientos" type="number" min={1} value={form.seats} onChange={(e) => set('seats', e.target.value)} error={formErrors.seats} />
          </div>
          <div className="modal-actions">
            <AppButton type="submit" loading={saving}>{editing ? 'Guardar cambios' : 'Registrar'}</AppButton>
            <AppButton variant="outline" onClick={() => setOpen(false)}>Cancelar</AppButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
