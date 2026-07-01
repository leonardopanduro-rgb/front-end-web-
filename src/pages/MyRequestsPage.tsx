import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingState } from '../components/LoadingState';
import { Pagination } from '../components/Pagination';
import { RequestCard } from '../components/RequestCard';
import { useAuth } from '../hooks/useAuth';
import { useUiFeedback } from '../hooks/useUiFeedback';
import { useRequests } from '../hooks/useRequests';
import { usePublications } from '../hooks/usePublications';
import { requestPublicationService } from '../services/requestPublication';
import { RequestPublication } from '../types/requestPublication';
import { parseAxiosError } from '../utils/errorMessages';

export const MyRequestsPage = () => {
  const { user } = useAuth();
  const { confirm, notify } = useUiFeedback();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { requests, setRequests, loading, error, fetch } = useRequests();
  const { publications, fetch: fetchPubs } = usePublications();
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [size, setSize] = useState(Number(searchParams.get('size')) || 10);

  const statusOrder = { ACCEPTED: 0, PENDING: 1, REJECTED: 2, CANCELLED: 3 };
  const mine = requests
    .filter((request) => request.requesterId === user?.id && !request.requesterIsDriver)
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  const pubById = new Map(publications.map((publication) => [publication.id, publication]));
  const safePage = Math.min(page, Math.max(1, Math.ceil(mine.length / size)));
  const paginated = mine.slice((safePage - 1) * size, safePage * size);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(controller.signal);
    void fetchPubs(controller.signal);
    return () => controller.abort();
  }, [fetch, fetchPubs]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (page !== 1) next.set('page', String(page));
    if (size !== 10) next.set('size', String(size));
    setSearchParams(next, { replace: true });
  }, [page, size, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [size]);

  const handleCancel = async (request: RequestPublication) => {
    const ok = await confirm({ title: 'Cancelar solicitud', message: 'Seguro que quieres cancelar esta solicitud?', confirmLabel: 'Cancelar solicitud', danger: true });
    if (!ok) return;
    setCancelling(request.id);
    try {
      const updated = await requestPublicationService.cancel(request.id);
      setRequests((current) => current.map((item) => (item.id === request.id ? updated : item)));
      notify('Solicitud cancelada.', 'success');
    } catch (err) {
      notify(parseAxiosError(err).message, 'error');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>Mis solicitudes</h1>
          <p>Revisa el estado de tus solicitudes enviadas.</p>
        </div>
      </section>
      <section className="info-band">
        <strong>Solicitudes enviadas</strong>
        <span>Las aceptadas y pendientes aparecen primero. Puedes cancelar únicamente las solicitudes pendientes.</span>
      </section>
      {loading ? <LoadingState /> : error ? <ErrorMessage error={error} onRetry={fetch} /> : mine.length === 0 ? (
        <EmptyState title="Sin solicitudes" subtitle="Busca un viaje y solicita un asiento" ctaLabel="Buscar viajes" onCta={() => navigate('/search-trips')} />
      ) : (
        <>
          <div className="cards-grid">
            {paginated.map((request) => <RequestCard key={request.id} req={request} publication={pubById.get(request.publicationId)} onCancel={request.status === 'PENDING' ? () => void handleCancel(request) : undefined} cancelling={cancelling === request.id} />)}
          </div>
          <Pagination page={safePage} size={size} total={mine.length} onPageChange={setPage} onSizeChange={setSize} />
        </>
      )}
    </div>
  );
};
