import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { CAREERS } from '../data/careers';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { publicationService } from '../services/publication';
import { requestPublicationService } from '../services/requestPublication';
import { userService } from '../services/user';
import { PublicUser } from '../types/user';
import { formatName, formatRating } from '../utils/formatters';

export const ProfilesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [people, setPeople] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [career, setCareer] = useState(searchParams.get('career') || '');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const controller = new AbortController();
    const loadPeople = async () => {
      setLoading(true);
      try {
        const [publications, requests] = await Promise.all([
          publicationService.getAllWithSignal(controller.signal),
          requestPublicationService.getAllWithSignal(controller.signal),
        ]);
        const ids = new Set<number>();
        if (user) ids.add(user.id);
        publications.forEach((publication) => ids.add(publication.authorId));
        requests.forEach((request) => ids.add(request.requesterId));

        const results = await Promise.allSettled([...ids].map((id) => userService.getPublicById(id)));
        if (controller.signal.aborted) return;
        setPeople(
          results
            .filter((result): result is PromiseFulfilledResult<PublicUser> => result.status === 'fulfilled')
            .map((result) => result.value),
        );
      } catch {
        // El estado vacio se encargara de comunicarlo.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void loadPeople();
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch) next.set('search', debouncedSearch);
    if (career) next.set('career', career);
    setSearchParams(next, { replace: true });
  }, [career, debouncedSearch, setSearchParams]);

  const filtered = useMemo(() => people
    .map((person) => ({
      id: person.id,
      name: formatName(`${person.name} ${person.lastName}`.trim()),
      career: person.career,
      rating: person.rating,
    }))
    .filter((profile) => {
      if (career && profile.career !== career) return false;
      if (debouncedSearch) {
        const term = debouncedSearch.toLowerCase();
        const text = `${profile.name} ${profile.career ?? ''}`.toLowerCase();
        if (!text.includes(term)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name)), [career, debouncedSearch, people]);

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>Perfiles</h1>
          <p>Busca estudiantes por nombre o carrera.</p>
        </div>
      </section>

      <section className="filter-panel compact">
        <label>
          Buscar
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o carrera" />
        </label>
        <label>
          Carrera
          <select value={career} onChange={(event) => setCareer(event.target.value)}>
            <option value="">Todas</option>
            {CAREERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </section>

      {loading ? <LoadingState message="Cargando perfiles..." /> : filtered.length === 0 ? (
        <EmptyState title="No hay perfiles" subtitle="Prueba con otra busqueda o carrera." />
      ) : (
        <div className="cards-grid">
          {filtered.map((profile) => (
            <button className="card profile-card clickable" key={profile.id} type="button" onClick={() => navigate(`/profiles/${profile.id}`)}>
              <div className="avatar small">{profile.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <h3>{profile.name}</h3>
                <p>{profile.career ? profile.career.replace(/_/g, ' ') : 'Estudiante UTEC'}</p>
                <span>{formatRating(profile.rating)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
