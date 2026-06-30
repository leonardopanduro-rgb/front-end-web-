import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { ridePassengerService } from '../services/ridePassenger';
import { rideService } from '../services/ride';
import { reviewService } from '../services/review';
import { AppError } from '../types/apiError';
import { Ride } from '../types/ride';
import { RidePassenger } from '../types/ridePassenger';
import { parseAxiosError } from '../utils/errorMessages';
import { formatDateTime, isPast } from '../utils/formatters';

export const ReviewPage = () => {
  const { rideId } = useParams();
  const id = Number(rideId);
  const { user } = useAuth();
  const [ride, setRide] = useState<Ride | null>(null);
  const [passengers, setPassengers] = useState<RidePassenger[]>([]);
  const [existingReviews, setExistingReviews] = useState<number[]>([]);
  const [reviewedId, setReviewedId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedRide, allPassengers, allReviews] = await Promise.all([
        rideService.getById(id),
        ridePassengerService.getAll(),
        reviewService.getAll(),
      ]);
      setRide(loadedRide);
      setPassengers(allPassengers.filter((passenger) => passenger.rideId === id));
      setExistingReviews(allReviews.filter((review) => review.reviewerId === user?.id && review.rideId === id).map((review) => review.reviewedId));
    } catch (err) {
      setError(err as AppError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorMessage error={error} onRetry={() => void load()} />;
  if (!ride) return null;

  if (!isPast(ride.departureTime)) {
    return (
      <section className="center-card">
        <h1>El viaje aun no ha ocurrido</h1>
        <p>Podras calificar despues del {formatDateTime(ride.departureTime)}.</p>
      </section>
    );
  }

  const participants: number[] = [];
  if (ride.driverId !== user?.id) participants.push(ride.driverId);
  passengers.forEach((passenger) => {
    if (passenger.passengerId !== user?.id) participants.push(passenger.passengerId);
  });
  const notReviewed = participants.filter((participantId) => !existingReviews.includes(participantId));

  const handleSubmit = async () => {
    setFeedback('');
    if (!reviewedId) {
      setFeedback('Elige a quien calificar.');
      return;
    }
    if (comment.length > 500) {
      setFeedback('El comentario debe tener maximo 500 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      await reviewService.create({ rideId: id, reviewedId, rating, comment: comment.trim() });
      setExistingReviews((current) => [...current, reviewedId]);
      setReviewedId(null);
      setComment('');
      setRating(5);
      setFeedback('Calificacion enviada.');
    } catch (err) {
      setFeedback(parseAxiosError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>Calificar participantes</h1>
          <p>Viaje del {formatDateTime(ride.departureTime)} hacia {ride.destinationOrOrigin}</p>
        </div>
      </section>
      {notReviewed.length === 0 ? (
        <div className="alert alert-success">Ya calificaste a todos los participantes.</div>
      ) : (
        <section className="card review-form">
          {feedback ? <div className={feedback === 'Calificacion enviada.' ? 'alert alert-success' : 'alert alert-error'}>{feedback}</div> : null}
          <span className="field-label">A quien quieres calificar?</span>
          <div className="choice-list">
            {notReviewed.map((participantId) => (
              <button key={participantId} className={`choice-card ${reviewedId === participantId ? 'active' : ''}`} onClick={() => setReviewedId(participantId)}>
                {participantId === ride.driverId ? 'Conductor' : 'Pasajero'} - Estudiante UTEC #{participantId}
              </button>
            ))}
          </div>
          <span className="field-label">Calificacion</span>
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} className={value <= rating ? 'active' : ''} onClick={() => setRating(value)}>{value <= rating ? '★' : '☆'}</button>
            ))}
          </div>
          <AppInput label="Comentario" multiline value={comment} onChange={(e) => setComment(e.target.value)} />
          <AppButton loading={submitting} onClick={() => void handleSubmit()}>Enviar calificacion</AppButton>
        </section>
      )}
    </div>
  );
};
