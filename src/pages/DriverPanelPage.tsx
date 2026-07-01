import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DriverRequestCard } from '../components/DriverRequestCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { useUiFeedback } from '../hooks/useUiFeedback';
import { usePublications } from '../hooks/usePublications';
import { publicationService } from '../services/publication';
import { requestPublicationService } from '../services/requestPublication';
import { Publication } from '../types/publication';
import { RequestPublication } from '../types/requestPublication';
import { parseAxiosError } from '../utils/errorMessages';

interface PubWithRequests {
  pub: Publication;
  requests: RequestPublication[];
  loadingReqs: boolean;
}

// Prioriza las solicitudes que requieren accion (Pendientes) y oculta las Canceladas
// por el pasajero, que solo agregan ruido al panel del conductor.
const STATUS_ORDER: Record<string, number> = { PENDING: 0, ACCEPTED: 1, REJECTED: 2, CANCELLED: 3 };
const prioritizeRequests = (requests: RequestPublication[]): RequestPublication[] =>
  requests
    .filter((request) => request.status !== 'CANCELLED')
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

export const DriverPanelPage = () => {
  const { user } = useAuth();
  const { notify } = useUiFeedback();
  const navigate = useNavigate();
  const { publications, loading, error, fetch } = usePublications();
  const [pubData, setPubData] = useState<PubWithRequests[]>([]);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();
    void fetch(controller.signal);
    return () => controller.abort();
  }, [fetch]);

  useEffect(() => {
    const myPubs = publications.filter((pub) => pub.authorId === user?.id && pub.fromUTEC && pub.driverToPassenger);
    setPubData(myPubs.map((pub) => ({ pub, requests: [], loadingReqs: true })));
    myPubs.forEach((pub) => {
      void publicationService.getRequests(pub.id)
        .then((requests) => setPubData((current) => current.map((item) => (item.pub.id === pub.id ? { ...item, requests: prioritizeRequests(requests), loadingReqs: false } : item))))
        .catch(() => setPubData((current) => current.map((item) => (item.pub.id === pub.id ? { ...item, loadingReqs: false } : item))));
    });
  }, [publications, user?.id]);

  const handleAccept = async (request: RequestPublication, pub: Publication) => {
    if (!pub.vehicleId) {
      notify('La publicacion no tiene vehiculo asignado.', 'error');
      return;
    }
    const key = `accept-${request.id}`;
    setProcessing((current) => ({ ...current, [key]: true }));
    try {
      const updated = await requestPublicationService.accept(request.id, { vehicleId: pub.vehicleId });
      setPubData((current) => current.map((item) => ({ ...item, requests: item.requests.map((req) => (req.id === request.id ? updated : req)) })));
      notify('Solicitud aceptada. El pasajero fue confirmado.', 'success');
    } catch (err) {
      notify(parseAxiosError(err).message, 'error');
    } finally {
      setProcessing((current) => ({ ...current, [key]: false }));
    }
  };

  const handleReject = async (request: RequestPublication) => {
    const key = `reject-${request.id}`;
    setProcessing((current) => ({ ...current, [key]: true }));
    try {
      const updated = await requestPublicationService.reject(request.id);
      setPubData((current) => current.map((item) => ({ ...item, requests: item.requests.map((req) => (req.id === request.id ? updated : req)) })));
      notify('Solicitud rechazada.', 'info');
    } catch (err) {
      notify(parseAxiosError(err).message, 'error');
    } finally {
      setProcessing((current) => ({ ...current, [key]: false }));
    }
  };

  if (loading) return <LoadingState message="Cargando tus publicaciones..." />;
  if (error) return <ErrorMessage error={error} onRetry={fetch} />;

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>Panel de solicitudes</h1>
          <p>Gestiona las solicitudes recibidas en tus publicaciones.</p>
        </div>
      </section>
      {pubData.length === 0 ? (
        <EmptyState title="Sin publicaciones" subtitle="Publica un viaje para gestionar solicitudes" ctaLabel="Publicar viaje" onCta={() => navigate('/publish-trip')} />
      ) : (
        pubData.map(({ pub, requests, loadingReqs }) => (
          <section className="publication-section" key={pub.id}>
            <button className="publication-header" onClick={() => navigate(`/trips/${pub.id}`)}>
              <strong>{pub.destinationOrOrigin}</strong>
              <span>{requests.filter((request) => request.status === 'PENDING').length} pendiente(s)</span>
            </button>
            {loadingReqs ? <LoadingState message="Cargando solicitudes..." /> : requests.length === 0 ? <p className="muted">Sin solicitudes aun</p> : (
              <div className="cards-grid">
                {requests.map((request) => (
                  <DriverRequestCard
                    key={request.id}
                    req={request}
                    onAccept={() => void handleAccept(request, pub)}
                    onReject={() => void handleReject(request)}
                    accepting={!!processing[`accept-${request.id}`]}
                    rejecting={!!processing[`reject-${request.id}`]}
                  />
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
};
