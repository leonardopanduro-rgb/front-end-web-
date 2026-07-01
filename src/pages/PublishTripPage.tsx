import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { useAuth } from '../hooks/useAuth';
import { useVehicles } from '../hooks/useVehicles';
import { publicationService } from '../services/publication';
import { parseAxiosError } from '../utils/errorMessages';
import { nextLocalIsoForTime } from '../utils/formatters';

export const PublishTripPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { vehicles, fetch: fetchVehicles } = useVehicles();
  const myVehicles = vehicles.filter((vehicle) => vehicle.ownerId === user?.id);
  const [descripcion, setDescripcion] = useState('');
  const [destination, setDestination] = useState('');
  const [seats, setSeats] = useState('');
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [departureHour, setDepartureHour] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchVehicles();
  }, [fetchVehicles]);

  const validate = () => {
    const next: Record<string, string> = {};
    const parsedSeats = Number.parseInt(seats, 10);
    if (descripcion.length > 500) next.descripcion = 'Maximo 500 caracteres';
    if (!destination.trim() || destination.length > 120) next.destination = 'Requerido, maximo 120 caracteres';
    if (!Number.isInteger(parsedSeats) || parsedSeats <= 0) next.seats = 'Debe ser al menos 1';
    if (!vehicleId) next.vehicle = 'Selecciona un vehiculo';
    const vehicle = myVehicles.find((item) => item.id === vehicleId);
    if (vehicle && parsedSeats > vehicle.seats) next.seats = `Maximo ${vehicle.seats} para este vehiculo`;
    if (!departureHour) next.departure = 'Selecciona una hora';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await publicationService.create({
        fromUTEC: true,
        driverToPassenger: true,
        seats: Number.parseInt(seats, 10),
        // DEUDA TECNICA: el backend exige `titulo` (@NotBlank), por eso lo autogeneramos
        // a partir del destino. No modificar el backend/DTO para este cambio de UI.
        titulo: `Salida UTEC - ${destination.trim()}`.slice(0, 120),
        descripcion: descripcion.trim(),
        destinationOrOrigin: destination.trim(),
        externalLatitude: null,
        externalLongitude: null,
        departureTime: nextLocalIsoForTime(departureHour),
        vehicleId,
      });
      navigate('/home');
    } catch (error) {
      setMessage(parseAxiosError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="page-stack form-page" onSubmit={handleSubmit}>
      <section className="page-title-row">
        <div>
          <h1>Publicar viaje</h1>
          <p>Publica una ruta como conductor desde UTEC hacia tu destino.</p>
        </div>
      </section>
      {message ? <div className="alert alert-error">{message}</div> : null}
      <section className="info-band">
        <strong>Origen fijo: UTEC</strong>
        <span>Esta publicación ofrecerá asientos como conductor.</span>
      </section>
      {myVehicles.length === 0 ? (
        <div className="alert alert-warning">
          Debes registrar un vehículo antes de publicar una ruta como conductor.
        </div>
      ) : null}
      <section className="form-grid two">
        <AppInput label="Destino" value={destination} onChange={(e) => setDestination(e.target.value)} error={errors.destination} />
        <AppInput label="Asientos" type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} error={errors.seats} />
        <AppInput label="Hora de salida" type="time" value={departureHour} onChange={(e) => setDepartureHour(e.target.value)} error={errors.departure} />
      </section>
      <AppInput label="Descripcion" multiline value={descripcion} onChange={(e) => setDescripcion(e.target.value)} error={errors.descripcion} />
      <label className="field">
        <span className="field-label">Vehículo</span>
        <select className={`input ${errors.vehicle ? 'input-error' : ''}`} value={vehicleId ?? ''} onChange={(e) => setVehicleId(Number(e.target.value) || null)}>
          <option value="">Selecciona un vehículo</option>
          {myVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.brand} {vehicle.model} ({vehicle.seats} asientos)</option>)}
        </select>
        {errors.vehicle ? <span className="field-error">{errors.vehicle}</span> : null}
      </label>
      <div className="form-actions">
        <AppButton type="submit" loading={submitting} disabled={myVehicles.length === 0}>Publicar viaje</AppButton>
      </div>
    </form>
  );
};
