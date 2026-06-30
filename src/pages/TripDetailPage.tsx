import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { DestinationMapPicker } from '../components/DestinationMapPicker';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { publicationService } from '../services/publication';
import { requestPublicationService } from '../services/requestPublication';
import { weatherService, WeatherInfo } from '../services/weather';
import { AppError } from '../types/apiError';
import { Publication } from '../types/publication';
import { parseAxiosError } from '../utils/errorMessages';
import { formatDepartureHour, formatDistance } from '../utils/formatters';
import { useRequests } from '../hooks/useRequests';
import { useRides } from '../hooks/useRides';
import { usePassengerEligibility } from '../hooks/usePassengerEligibility';

export const TripDetailPage = () => {
  const { publicationId } = useParams();
  const id = Number(publicationId);
  const { user } = useAuth();
  const [pub, setPub] = useState<Publication | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const { requests, loading: loadingRequests, fetch: fetchRequests } = useRequests();
  const { myRides, loading: loadingRides, fetch: fetchRides } = useRides(user?.id ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [seats, setSeats] = useState('1');
  const [pickup, setPickup] = useState('');
  const [message, setMessage] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [destinationPoint, setDestinationPoint] = useState<{ lat: number; lng: number } | null>(null);
  const eligibility = usePassengerEligibility(requests, myRides, user?.id ?? null, id);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const publication = await publicationService.getById(id);
      setPub(publication);
    } catch (err) {
      setError(err as AppError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void fetchRequests();
    void fetchRides();
    void weatherService.getCurrent().then(setWeather);
  }, [id, fetchRequests, fetchRides]);

  const validate = () => {
    const next: Record<string, string> = {};
    const parsedSeats = Number.parseInt(seats, 10);
    if (!pickup.trim() && !destinationPoint) next.pickup = 'Escribe un destino o marca un punto en el mapa';
    if (!Number.isInteger(parsedSeats) || parsedSeats <= 0) next.seats = 'Debe ser al menos 1';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!pub || !validate()) return;
    if (!eligibility.canRequest) return;
    setSubmitting(true);
    setFeedback('');
    try {
      await requestPublicationService.create(pub.id, {
        requesterIsDriver: false,
        seats: Number.parseInt(seats, 10),
        message: message.trim(),
        pickupPointOrDestine: pickup.trim(),
        externalLatitude: destinationPoint?.lat ?? null,
        externalLongitude: destinationPoint?.lng ?? null,
      });
      setSubmitted(true);
      setFeedback('Solicitud enviada. El responsable de la publicacion la revisara pronto.');
    } catch (err) {
      setFeedback(parseAxiosError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingRequests || loadingRides) return <LoadingState message="Cargando viaje..." />;
  if (error) return <ErrorMessage error={error} onRetry={() => void load()} />;
  if (!pub) return null;

  const isOwn = pub.authorId === user?.id;
  const isAvailablePassengerTrip = pub.fromUTEC && pub.driverToPassenger;

  return (
    <div className="page-stack detail-layout">
      <section className="card detail-main">
        <div className="card-topline">
          <span className="eyebrow">Salida desde UTEC</span>
          <span>{pub.driverToPassenger ? 'Ofrece asientos' : 'Publicación no disponible'}</span>
        </div>
        <h1>{pub.titulo}</h1>
        {pub.descripcion ? <p>{pub.descripcion}</p> : null}
        <dl className="info-list">
          <div><dt>Destino</dt><dd>{pub.destinationOrOrigin}</dd></div>
          <div><dt>Hora de salida</dt><dd>{formatDepartureHour(pub.departureTime)}</dd></div>
          <div><dt>Asientos</dt><dd>{pub.seats}</dd></div>
          {pub.distanceToUtecKm != null ? <div><dt>Distancia a UTEC</dt><dd>{formatDistance(pub.distanceToUtecKm)}</dd></div> : null}
          <div><dt>Autor</dt><dd>Estudiante UTEC #{pub.authorId}</dd></div>
          {weather ? <div><dt>Clima en UTEC</dt><dd>{weather.description} {weather.temperature} C</dd></div> : null}
        </dl>
      </section>

      {!isOwn && isAvailablePassengerTrip && !submitted && eligibility.canRequest ? (
        <form className="card side-form" onSubmit={handleRequest}>
          <h2>Solicitar asiento</h2>
          {feedback ? <div className="alert alert-error">{feedback}</div> : null}
          <AppInput
            label="Punto de destino"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="Ej: Parque Kennedy, Miraflores"
            helper="Puedes escribir el destino, marcarlo en el mapa o usar ambos."
            error={formErrors.pickup}
          />
          <DestinationMapPicker value={destinationPoint} onChange={setDestinationPoint} />
          {!pickup.trim() && destinationPoint ? (
            <div className="alert alert-warning">
              El mapa ya es válido para la interfaz, pero el backend actual todavía exige también un texto de destino.
            </div>
          ) : null}
          <AppInput label="Asientos que necesitas" type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} error={formErrors.seats} />
          <AppInput label="Mensaje" multiline value={message} onChange={(e) => setMessage(e.target.value)} />
          <AppButton type="submit" loading={submitting}>Enviar solicitud</AppButton>
        </form>
      ) : null}

      {submitted ? <div className="alert alert-success">Solicitud enviada. Asiento solicitado, pendiente de confirmacion.</div> : null}
      {!isOwn && isAvailablePassengerTrip && !submitted && !eligibility.canRequest ? (
        <div className="alert alert-info">{eligibility.blockReason}</div>
      ) : null}
      {!isOwn && !isAvailablePassengerTrip ? (
        <div className="alert alert-warning">Esta publicación no pertenece al flujo actual de viajes desde UTEC ofrecidos por conductores.</div>
      ) : null}
      {isOwn ? <div className="alert alert-info">Esta es tu publicacion. Gestiona solicitudes en el panel conductor.</div> : null}
    </div>
  );
};
