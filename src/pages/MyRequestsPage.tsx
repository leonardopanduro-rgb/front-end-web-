import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingState } from '../components/LoadingState';
import { Pagination } from '../components/Pagination';
import { RequestCard } from '../components/RequestCard';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useRequests } from '../hooks/useRequests';
import { requestPublicationService } from '../services/requestPublication';
import { RequestPublication, RequestStatus } from '../types/requestPublication';
import { parseAxiosError } from '../utils/errorMessages';

type StatusFilter = 'all' | RequestStatus;

export const MyRequestsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { requests, setRequests, loading, error, fetch } = useRequests();
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [status, setStatus] = useState<StatusFilter>((searchParams.get('status') as StatusFilter) || 'all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [size, setSize] = useState(Number(searchParams.get('size')) || 10);
  const debouncedSearch = useDebouncedValue(search);

  const mine = requests.filter((request) => {
    if (request.requesterId !== user?.id) return false;
    if (status !== 'all' && request.status !== status) return false;
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      const text = `${request.message} ${request.pickupPointOrDestine} ${request.status} ${request.publicationId}`.toLowerCase();
      if (!text.includes(term)) return false;
    }
    return true;
  });
  const safePage = Math.min(page, Math.max(1, Math.ceil(mine.length / size)));
  const paginated = mine.slice((safePage - 1) * size, safePage * size);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(controller.signal);
    return () => controller.abort();
  }, [fetch]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (status !== 'all') next.set('status', status);
    if (debouncedSearch) next.set('search', debouncedSearch);
    if (page !== 1) next.set('page', String(page));
    if (size !== 10) next.set('size', String(size));
    setSearchParams(next, { replace: true });
  }, [status, debouncedSearch, page, size, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch, size]);

  const handleCancel = async (request: RequestPublication) => {
    if (!window.confirm('Seguro que quieres cancelar esta solicitud?')) return;
    setCancelling(request.id);
    try {
      const updated = await requestPublicationService.cancel(request.id);
      setRequests((current) => current.map((item) => (item.id === request.id ? updated : item)));
    } catch (err) {
      window.alert(parseAxiosError(err).message);
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
      <section className="filter-panel compact">
        <label>
          Buscar
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Publicacion, punto o mensaje" />
        </label>
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="all">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="ACCEPTED">Aceptadas</option>
            <option value="REJECTED">Rechazadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
        </label>
      </section>
      {loading ? <LoadingState /> : error ? <ErrorMessage error={error} onRetry={fetch} /> : mine.length === 0 ? (
        <EmptyState title="Sin solicitudes" subtitle="Busca un viaje y solicita un asiento" ctaLabel="Buscar viajes" onCta={() => navigate('/search-trips')} />
      ) : (
        <>
          <div className="cards-grid">
            {paginated.map((request) => <RequestCard key={request.id} req={request} onCancel={request.status === 'PENDING' ? () => void handleCancel(request) : undefined} cancelling={cancelling === request.id} />)}
          </div>
          <Pagination page={safePage} size={size} total={mine.length} onPageChange={setPage} onSizeChange={setSize} />
        </>
      )}
    </div>
  );
};
