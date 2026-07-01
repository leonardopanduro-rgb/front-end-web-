import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { LoadingState } from '../components/LoadingState';
import { VehicleCard } from '../components/VehicleCard';
import { useAuth } from '../hooks/useAuth';
import { useVehicles } from '../hooks/useVehicles';
import { publicationService } from '../services/publication';
import { parseAxiosError } from '../utils/errorMessages';
import { formatRating, nextLocalIsoForWeekdayTime } from '../utils/formatters';

interface ScheduleEntry {
  id: string;
  weekday: number;
  time: string;
  destination: string;
  seats: string;
  vehicleId: string;
}

const WEEKDAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
  { value: 0, label: 'Domingo' },
];

const blankScheduleEntry = (): ScheduleEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  weekday: 1,
  time: '',
  destination: '',
  seats: '1',
  vehicleId: '',
});

export const ProfilePage = () => {
  const { user, mode, refreshUser } = useAuth();
  const { vehicles, loading, fetch } = useVehicles();
  const navigate = useNavigate();
  const [publishingSchedule, setPublishingSchedule] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  useEffect(() => {
    void refreshUser();
    void fetch();
  }, [refreshUser, fetch]);

  useEffect(() => {
    if (!user) return;
    const saved = window.localStorage.getItem(`carpool-schedule-${user.id}`);
    setSchedule(saved ? JSON.parse(saved) as ScheduleEntry[] : [blankScheduleEntry()]);
  }, [user]);

  if (!user) return <LoadingState />;

  const myVehicles = vehicles.filter((vehicle) => vehicle.ownerId === user.id);
  const saveSchedule = (next: ScheduleEntry[]) => {
    setSchedule(next);
    window.localStorage.setItem(`carpool-schedule-${user.id}`, JSON.stringify(next));
  };

  const updateSchedule = (id: string, patch: Partial<ScheduleEntry>) => {
    saveSchedule(schedule.map((entry) => entry.id === id ? { ...entry, ...patch } : entry));
  };

  const addScheduleEntry = () => saveSchedule([...schedule, blankScheduleEntry()]);
  const removeScheduleEntry = (id: string) => saveSchedule(schedule.filter((entry) => entry.id !== id));

  const publishSchedule = async () => {
    setScheduleMessage('');
    const validEntries = schedule.filter((entry) => entry.time && entry.destination.trim() && entry.vehicleId);
    if (validEntries.length === 0) {
      setScheduleMessage('Completa al menos un horario con hora, destino y vehiculo.');
      return;
    }
    setPublishingSchedule(true);
    try {
      await Promise.all(validEntries.map((entry) => publicationService.create({
        fromUTEC: true,
        driverToPassenger: true,
        seats: Number.parseInt(entry.seats, 10) || 1,
        titulo: `Salida ${WEEKDAYS.find((day) => day.value === entry.weekday)?.label ?? ''} ${entry.time}`,
        descripcion: 'Viaje publicado desde mi itinerario semanal.',
        destinationOrOrigin: entry.destination.trim(),
        externalLatitude: null,
        externalLongitude: null,
        departureTime: nextLocalIsoForWeekdayTime(entry.weekday, entry.time),
        vehicleId: Number(entry.vehicleId),
      })));
      setScheduleMessage('Itinerario publicado. Tus viajes ya apareceran en la busqueda.');
    } catch (error) {
      setScheduleMessage(parseAxiosError(error).message);
    } finally {
      setPublishingSchedule(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="profile-header">
        <div className="avatar">{user.name[0]}{user.lastName[0]}</div>
        <div>
          <h1>{user.name} {user.lastName}</h1>
          <p>{user.email}</p>
          <strong>{formatRating(user.rating)}</strong>
        </div>
      </section>
      <section className="card">
        <dl className="info-list">
          <div><dt>Codigo</dt><dd>{user.studentCode}</dd></div>
          <div><dt>Carrera</dt><dd>{user.career.replace(/_/g, ' ')}</dd></div>
          <div><dt>Ciclo</dt><dd>{user.cycle}</dd></div>
          <div><dt>Telefono</dt><dd>{user.phone}</dd></div>
        </dl>
      </section>
      {mode === 'driver' ? (
        <>
      <section className="page-stack">
        <div className="section-header">
          <h2>Mi itinerario de salidas</h2>
          <AppButton variant="outline" onClick={addScheduleEntry}>Agregar horario</AppButton>
        </div>
        {scheduleMessage ? <div className="alert alert-info">{scheduleMessage}</div> : null}
        <div className="schedule-list">
          {schedule.map((entry) => (
            <article className="card schedule-card" key={entry.id}>
              <label className="field">
                <span className="field-label">Dia</span>
                <select className="input" value={entry.weekday} onChange={(event) => updateSchedule(entry.id, { weekday: Number(event.target.value) })}>
                  {WEEKDAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                </select>
              </label>
              <AppInput label="Hora" type="time" value={entry.time} onChange={(event) => updateSchedule(entry.id, { time: event.target.value })} />
              <AppInput label="Destino" value={entry.destination} onChange={(event) => updateSchedule(entry.id, { destination: event.target.value })} placeholder="Ej: Miraflores" />
              <AppInput label="Asientos" type="number" min={1} value={entry.seats} onChange={(event) => updateSchedule(entry.id, { seats: event.target.value })} />
              <label className="field">
                <span className="field-label">Vehiculo</span>
                <select className="input" value={entry.vehicleId} onChange={(event) => updateSchedule(entry.id, { vehicleId: event.target.value })}>
                  <option value="">Selecciona</option>
                  {myVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.brand} {vehicle.model}</option>)}
                </select>
              </label>
              <AppButton variant="ghost" onClick={() => removeScheduleEntry(entry.id)}>Quitar</AppButton>
            </article>
          ))}
        </div>
        <div className="form-actions">
          <AppButton variant="secondary" loading={publishingSchedule} disabled={myVehicles.length === 0} onClick={() => void publishSchedule()}>
            Publicar itinerario
          </AppButton>
          {myVehicles.length === 0 ? <AppButton variant="outline" onClick={() => navigate('/vehicles')}>Registrar vehiculo</AppButton> : null}
        </div>
      </section>
      <section className="page-stack">
        <div className="section-header">
          <h2>Mis vehiculos</h2>
          <AppButton variant="outline" onClick={() => navigate('/vehicles')}>Gestionar</AppButton>
        </div>
        {loading ? <LoadingState message="Cargando vehiculos..." /> : myVehicles.length === 0 ? (
          <AppButton variant="outline" onClick={() => navigate('/vehicles')}>Registrar vehiculo</AppButton>
        ) : (
          <div className="cards-grid">
            {myVehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onEdit={() => navigate('/vehicles')} />)}
          </div>
        )}
      </section>
        </>
      ) : null}
    </div>
  );
};
