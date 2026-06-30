import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingState } from '../components/LoadingState';
import { Pagination } from '../components/Pagination';
import { TripCard } from '../components/TripCard';
import { DISTRICT_NAMES } from '../data/limaPlaces';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePublications } from '../hooks/usePublications';
import { useRequests } from '../hooks/useRequests';
import { useRides } from '../hooks/useRides';

type Direction = 'all' | 'fromUTEC' | 'toUTEC';
type Kind = 'all' | 'offers' | 'seeks';
type Sort = 'soonest' | 'seats';

export const SearchTripsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { publications, loading, error, fetch } = usePublications();
  const { requests, fetch: fetchReqs } = useRequests();
  const { myRides, fetch: fetchRides } = useRides(user?.id ?? null);
  const [direction, setDirection] = useState<Direction>((searchParams.get('direction') as Direction) || 'all');
  const [kind, setKind] = useState<Kind>((searchParams.get('kind') as Kind) || 'all');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState<Sort>((searchParams.get('sort') as Sort) || 'soonest');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [size, setSize] = useState(Number(searchParams.get('size')) || 10);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(controller.signal);
    void fetchReqs(controller.signal);
    void fetchRides(controller.signal);
    return () => controller.abort();
  }, [fetch, fetchReqs, fetchRides]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (direction !== 'all') next.set('direction', direction);
    if (kind !== 'all') next.set('kind', kind);
    if (district) next.set('district', district);
    if (debouncedSearch) next.set('search', debouncedSearch);
    if (sort !== 'soonest') next.set('sort', sort);
    if (page !== 1) next.set('page', String(page));
    if (size !== 10) next.set('size', String(size));
    setSearchParams(next, { replace: true });
  }, [direction, kind, district, debouncedSearch, sort, page, size, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [direction, kind, district, debouncedSearch, sort, size]);

  const confirmedPubIds = new Set<number>([
    ...myRides.map((entry) => entry.ride.publicationId),
    ...requests.filter((req) => req.requesterId === user?.id && req.status === 'ACCEPTED').map((req) => req.publicationId),
  ]);
  const pendingPubIds = new Set(requests.filter((req) => req.requesterId === user?.id && req.status === 'PENDING').map((req) => req.publicationId));

  const filtered = publications.filter((pub) => {
    if (pub.authorId === user?.id) return false;
    if (confirmedPubIds.has(pub.id)) return false;
    if (direction === 'fromUTEC' && !pub.fromUTEC) return false;
    if (direction === 'toUTEC' && pub.fromUTEC) return false;
    if (kind === 'offers' && !pub.driverToPassenger) return false;
    if (kind === 'seeks' && pub.driverToPassenger) return false;
    if (district && !pub.destinationOrOrigin.toLowerCase().includes(district.toLowerCase())) return false;
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      const text = `${pub.titulo} ${pub.descripcion} ${pub.destinationOrOrigin}`.toLowerCase();
      if (!text.includes(term)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sort === 'seats') return b.seats - a.seats;
    return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
  });

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / size)));
  const paginated = filtered.slice((safePage - 1) * size, safePage * size);

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>Buscar viajes</h1>
          <p>Filtra publicaciones disponibles de otros estudiantes.</p>
        </div>
      </section>
      <section className="filter-panel">
        <label>
          Buscar
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Titulo, distrito o descripcion" />
        </label>
        <label>
          Sentido
          <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
            <option value="all">Todos</option>
            <option value="fromUTEC">Saliendo de UTEC</option>
            <option value="toUTEC">Hacia campus</option>
          </select>
        </label>
        <label>
          Tipo
          <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            <option value="all">Todos</option>
            <option value="offers">Ofrece asiento</option>
            <option value="seeks">Busca conductor</option>
          </select>
        </label>
        <label>
          Distrito
          <select value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">Todos</option>
            {DISTRICT_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label>
          Ordenar
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="soonest">Mas proximos</option>
            <option value="seats">Mas asientos</option>
          </select>
        </label>
      </section>
      {loading ? <LoadingState /> : error ? <ErrorMessage error={error} onRetry={fetch} /> : filtered.length === 0 ? (
        <EmptyState title="No hay viajes disponibles" subtitle="Prueba cambiando los filtros" />
      ) : (
        <>
          <div className="cards-grid">
            {paginated.map((pub) => (
              <TripCard key={pub.id} pub={pub} statusBadge={pendingPubIds.has(pub.id) ? 'Pendiente' : undefined} onClick={() => navigate(`/trips/${pub.id}`)} />
            ))}
          </div>
          <Pagination page={safePage} size={size} total={filtered.length} onPageChange={setPage} onSizeChange={setSize} />
        </>
      )}
    </div>
  );
};
