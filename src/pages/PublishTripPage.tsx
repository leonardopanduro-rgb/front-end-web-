import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { useAuth } from '../hooks/useAuth';
import { useVehicles } from '../hooks/useVehicles';
import { publicationService } from '../services/publication';
import { getCurrentCoords } from '../utils/locationHelpers';
import { parseAxiosError } from '../utils/errorMessages';

type PublishMode = 'driver' | 'passenger';

export const PublishTripPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { vehicles, fetch: fetchVehicles } = useVehicles();
  const myVehicles = vehicles.filter((vehicle) => vehicle.ownerId === user?.id);
  const [mode, setMode] = useState<PublishMode>('driver');
  const [fromUTEC, setFromUTEC] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [destination, setDestination] = useState('');
  const [seats, setSeats] = useState('');
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [departure, setDeparture] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchVehicles();
  }, [fetchVehicles]);

  const validate = () => {
    const next: Record<string, string> = {};
    const parsedSeats = Number.parseInt(seats, 10);
    if (!titulo.trim() || titulo.length > 120) next.titulo = 'Requerido, maximo 120 caracteres';
    if (descripcion.length > 500) next.descripcion = 'Maximo 500 caracteres';
    if (!destination.trim() || destination.length > 120) next.destination = 'Requerido, maximo 120 caracteres';
    if (!Number.isInteger(parsedSeats) || parsedSeats <= 0) next.seats = 'Debe ser al menos 1';
    if (mode === 'driver') {
      if (!vehicleId) next.vehicle = 'Selecciona un vehiculo';
      const vehicle = myVehicles.find((item) => item.id === vehicleId);
      if (vehicle && parsedSeats > vehicle.seats) next.seats = `Maximo ${vehicle.seats} para este vehiculo`;
    }
    if (!departure) next.departure = 'Selecciona fecha y hora';
    else if (new Date(departure).getTime() < Date.now()) next.departure = 'La salida debe ser futura';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleGPS = async () => {
    setLoadingGPS(true);
    const result = await getCurrentCoords();
    setLoadingGPS(false);
    if (!result) {
      window.alert('No se pudo obtener la ubicacion. Puedes continuar sin coordenadas.');
      return;
    }
    setCoords({ lat: result.latitude, lng: result.longitude });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await publicationService.create({
        fromUTEC,
        driverToPassenger: mode === 'driver',
        seats: Number.parseInt(seats, 10),
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        destinationOrOrigin: destination.trim(),
        externalLatitude: coords?.lat ?? null,
        externalLongitude: coords?.lng ?? null,
        departureTime: `${departure}:00`,
        vehicleId: mode === 'driver' ? vehicleId : null,
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
          <p>Ofrece asientos o busca conductor para un trayecto UTEC.</p>
        </div>
      </section>
      {message ? <div className="alert alert-error">{message}</div> : null}
      <section className="form-section">
        <span className="field-label">Que ofreces?</span>
        <div className="segmented">
          <button type="button" className={mode === 'driver' ? 'active' : ''} onClick={() => setMode('driver')}>Tengo auto y ofrezco asientos</button>
          <button type="button" className={mode === 'passenger' ? 'active' : ''} onClick={() => setMode('passenger')}>Busco conductor</button>
        </div>
        <span className="field-label">Sentido del viaje</span>
        <div className="segmented">
          <button type="button" className={fromUTEC ? 'active' : ''} onClick={() => setFromUTEC(true)}>Saliendo de UTEC</button>
          <button type="button" className={!fromUTEC ? 'active' : ''} onClick={() => setFromUTEC(false)}>Hacia campus</button>
        </div>
      </section>
      <section className="form-grid two">
        <AppInput label="Titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} error={errors.titulo} />
        <AppInput label={fromUTEC ? 'Destino' : 'Origen'} value={destination} onChange={(e) => setDestination(e.target.value)} error={errors.destination} />
        <AppInput label="Asientos" type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} error={errors.seats} />
        <AppInput label="Fecha y hora de salida" type="datetime-local" value={departure} onChange={(e) => setDeparture(e.target.value)} error={errors.departure} />
      </section>
      <AppInput label="Descripcion" multiline value={descripcion} onChange={(e) => setDescripcion(e.target.value)} error={errors.descripcion} />
      {mode === 'driver' ? (
        <label className="field">
          <span className="field-label">Vehiculo</span>
          <select className={`input ${errors.vehicle ? 'input-error' : ''}`} value={vehicleId ?? ''} onChange={(e) => setVehicleId(Number(e.target.value) || null)}>
            <option value="">Selecciona un vehiculo</option>
            {myVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.brand} {vehicle.model} ({vehicle.seats} asientos)</option>)}
          </select>
          {errors.vehicle ? <span className="field-error">{errors.vehicle}</span> : null}
        </label>
      ) : null}
      <div className="form-actions">
        <AppButton variant="outline" loading={loadingGPS} onClick={() => void handleGPS()}>{coords ? 'Coordenadas capturadas' : 'Usar mi ubicacion'}</AppButton>
        <AppButton type="submit" loading={submitting}>Publicar viaje</AppButton>
      </div>
    </form>
  );
};
