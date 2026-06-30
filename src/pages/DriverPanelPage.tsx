import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { DriverRequestCard } from '../components/DriverRequestCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingState } from '../components/LoadingState';
import { Modal } from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { usePublications } from '../hooks/usePublications';
import { publicationService } from '../services/publication';
import { requestPublicationService } from '../services/requestPublication';
import { vehicleService } from '../services/vehicle';
import { Publication } from '../types/publication';
import { RequestPublication } from '../types/requestPublication';
import { Vehicle } from '../types/vehicle';
import { parseAxiosError } from '../utils/errorMessages';

interface PubWithRequests {
  pub: Publication;
  requests: RequestPublication[];
  loadingReqs: boolean;
}

export const DriverPanelPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { publications, loading, error, fetch } = usePublications();
  const [pubData, setPubData] = useState<PubWithRequests[]>([]);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [vehicleModal, setVehicleModal] = useState(false);
  const [pendingAccept, setPendingAccept] = useState<{ req: RequestPublication; pub: Publication } | null>(null);
  const [requesterVehicles, setRequesterVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(controller.signal);
    return () => controller.abort();
  }, [fetch]);

  useEffect(() => {
    const myPubs = publications.filter((pub) => pub.authorId === user?.id);
    setPubData(myPubs.map((pub) => ({ pub, requests: [], loadingReqs: true })));
    myPubs.forEach((pub) => {
      void publicationService.getRequests(pub.id)
        .then((requests) => setPubData((current) => current.map((item) => (item.pub.id === pub.id ? { ...item, requests, loadingReqs: false } : item))))
        .catch(() => setPubData((current) => current.map((item) => (item.pub.id === pub.id ? { ...item, loadingReqs: false } : item))));
    });
  }, [publications, user?.id]);

  const doAccept = async (request: RequestPublication, vehicleId: number) => {
    const key = `accept-${request.id}`;
    setProcessing((current) => ({ ...current, [key]: true }));
    try {
      const updated = await requestPublicationService.accept(request.id, { vehicleId });
      setPubData((current) => current.map((item) => ({ ...item, requests: item.requests.map((req) => (req.id === request.id ? updated : req)) })));
    } catch (err) {
      window.alert(parseAxiosError(err).message);
    } finally {
      setProcessing((current) => ({ ...current, [key]: false }));
    }
  };

  const initiateAccept = async (request: RequestPublication, pub: Publication) => {
    if (pub.driverToPassenger) {
      if (!pub.vehicleId) {
        window.alert('La publicacion no tiene vehiculo asignado.');
        return;
      }
      await doAccept(request, pub.vehicleId);
      return;
    }

    try {
      const allVehicles = await vehicleService.getAll();
      const vehicles = allVehicles.filter((vehicle) => vehicle.ownerId === request.requesterId);
      if (vehicles.length === 0) {
        window.alert('El solicitante no tiene vehiculos registrados.');
        return;
      }
      setRequesterVehicles(vehicles);
      setSelectedVehicleId(vehicles[0].id);
      setPendingAccept({ req: request, pub });
      setVehicleModal(true);
    } catch (err) {
      window.alert(parseAxiosError(err).message);
    }
  };

  const handleReject = async (request: RequestPublication) => {
    const key = `reject-${request.id}`;
    setProcessing((current) => ({ ...current, [key]: true }));
    try {
      const updated = await requestPublicationService.reject(request.id);
      setPubData((current) => current.map((item) => ({ ...item, requests: item.requests.map((req) => (req.id === request.id ? updated : req)) })));
    } catch (err) {
      window.alert(parseAxiosError(err).message);
    } finally {
      setProcessing((current) => ({ ...current, [key]: false }));
    }
  };

  const confirmAccept = async () => {
    if (!pendingAccept || !selectedVehicleId) return;
    setVehicleModal(false);
    await doAccept(pendingAccept.req, selectedVehicleId);
    setPendingAccept(null);
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
              <strong>{pub.titulo}</strong>
              <span>{pub.driverToPassenger ? 'Conductor' : 'Pasajero'}</span>
            </button>
            {loadingReqs ? <LoadingState message="Cargando solicitudes..." /> : requests.length === 0 ? <p className="muted">Sin solicitudes aun</p> : (
              <div className="cards-grid">
                {requests.map((request) => (
                  <DriverRequestCard
                    key={request.id}
                    req={request}
                    onAccept={() => void initiateAccept(request, pub)}
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
      <Modal open={vehicleModal} title="Seleccionar vehiculo del conductor" onClose={() => setVehicleModal(false)}>
        <div className="modal-form">
          {requesterVehicles.map((vehicle) => (
            <button key={vehicle.id} className={`choice-card ${selectedVehicleId === vehicle.id ? 'active' : ''}`} onClick={() => setSelectedVehicleId(vehicle.id)}>
              <strong>{vehicle.plate}</strong>
              <span>{vehicle.brand} {vehicle.model} · {vehicle.color} · {vehicle.seats} asientos</span>
            </button>
          ))}
          <div className="modal-actions">
            <AppButton onClick={() => void confirmAccept()}>Confirmar aceptar</AppButton>
            <AppButton variant="outline" onClick={() => setVehicleModal(false)}>Cancelar</AppButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
