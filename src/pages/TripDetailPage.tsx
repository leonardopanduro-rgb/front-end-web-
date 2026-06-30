import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { publicationService } from '../services/publication';
import { requestPublicationService } from '../services/requestPublication';
import { vehicleService } from '../services/vehicle';
import { weatherService, WeatherInfo } from '../services/weather';
import { AppError } from '../types/apiError';
import { Publication } from '../types/publication';
import { parseAxiosError } from '../utils/errorMessages';
import { formatDateTime, formatDistance } from '../utils/formatters';

export const TripDetailPage = () => {
  const { publicationId } = useParams();
  const id = Number(publicationId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pub, setPub] = useState<Publication | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [seats, setSeats] = useState('1');
  const [pickup, setPickup] = useState('');
  const [message, setMessage] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [publication, vehicles] = await Promise.all([
        publicationService.getById(id),
        vehicleService.getAll(),
      ]);
      setPub(publication);
      setHasVehicle(vehicles.some((vehicle) => vehicle.ownerId === user?.id));
    } catch (err) {
      setError(err as AppError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void weatherService.getCurrent().then(setWeather);
  }, [id]);

  const validate = () => {
    const next: Record<string, string> = {};
    const parsedSeats = Number.parseInt(seats, 10);
    if (!pickup.trim()) next.pickup = 'El punto de recojo/destino es obligatorio';
    if (!Number.isInteger(parsedSeats) || parsedSeats <= 0) next.seats = 'Debe ser al menos 1';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!pub || !validate()) return;
    const requesterIsDriver = !pub.driverToPassenger;
    if (requesterIsDriver && !hasVehicle) {
      if (window.confirm('Debes registrar un vehiculo para solicitar como conductor. Ir a vehiculos?')) navigate('/vehicles');
      return;
    }
    setSubmitting(true);
    setFeedback('');
    try {
      await requestPublicationService.create(pub.id, {
        requesterIsDriver,
        seats: Number.parseInt(seats, 10),
        message: message.trim(),
        pickupPointOrDestine: pickup.trim(),
        externalLatitude: null,
        externalLongitude: null,
      });
      setSubmitted(true);
      setFeedback('Solicitud enviada. El responsable de la publicacion la revisara pronto.');
    } catch (err) {
      setFeedback(parseAxiosError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Cargando viaje..." />;
  if (error) return <ErrorMessage error={error} onRetry={() => void load()} />;
  if (!pub) return null;

  const isOwn = pub.authorId === user?.id;
  const requesterIsDriver = !pub.driverToPassenger;

  return (
    <div className="page-stack detail-layout">
      <section className="card detail-main">
        <div className="card-topline">
          <span className="eyebrow">{pub.fromUTEC ? 'Saliendo de UTEC' : 'Hacia campus'}</span>
          <span>{pub.driverToPassenger ? 'Ofrece asientos' : 'Busca conductor'}</span>
        </div>
        <h1>{pub.titulo}</h1>
        {pub.descripcion ? <p>{pub.descripcion}</p> : null}
        <dl className="info-list">
          <div><dt>Destino / origen</dt><dd>{pub.destinationOrOrigin}</dd></div>
          <div><dt>Salida</dt><dd>{formatDateTime(pub.departureTime)}</dd></div>
          <div><dt>Asientos</dt><dd>{pub.seats}</dd></div>
          {pub.distanceToUtecKm != null ? <div><dt>Distancia a UTEC</dt><dd>{formatDistance(pub.distanceToUtecKm)}</dd></div> : null}
          <div><dt>Autor</dt><dd>Estudiante UTEC #{pub.authorId}</dd></div>
          {weather ? <div><dt>Clima en UTEC</dt><dd>{weather.description} {weather.temperature} C</dd></div> : null}
        </dl>
      </section>

      {!isOwn && !submitted ? (
        <form className="card side-form" onSubmit={handleRequest}>
          <h2>{requesterIsDriver ? 'Solicitar como conductor' : 'Solicitar asiento'}</h2>
          {requesterIsDriver && !hasVehicle ? <div className="alert alert-warning">Necesitas registrar un vehiculo para solicitar como conductor.</div> : null}
          {feedback ? <div className="alert alert-error">{feedback}</div> : null}
          <AppInput label="Punto de recojo / destino" value={pickup} onChange={(e) => setPickup(e.target.value)} error={formErrors.pickup} />
          <AppInput label="Asientos que necesitas" type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} error={formErrors.seats} />
          <AppInput label="Mensaje" multiline value={message} onChange={(e) => setMessage(e.target.value)} />
          <AppButton type="submit" loading={submitting} disabled={requesterIsDriver && !hasVehicle}>Enviar solicitud</AppButton>
        </form>
      ) : null}

      {submitted ? <div className="alert alert-success">Solicitud enviada. Asiento solicitado, pendiente de confirmacion.</div> : null}
      {isOwn ? <div className="alert alert-info">Esta es tu publicacion. Gestiona solicitudes en el panel conductor.</div> : null}
    </div>
  );
};
