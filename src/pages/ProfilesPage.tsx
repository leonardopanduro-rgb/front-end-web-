import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { CAREERS } from '../data/careers';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePublications } from '../hooks/usePublications';
import { useRequests } from '../hooks/useRequests';
import { formatRating } from '../utils/formatters';

interface ProfileSummary {
  id: number;
  name: string;
  career: string | null;
  rating: number | null;
}

export const ProfilesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { publications, loading: loadingPublications, fetch: fetchPublications } = usePublications();
  const { requests, loading: loadingRequests, fetch: fetchRequests } = useRequests();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [career, setCareer] = useState(searchParams.get('career') || '');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const controller = new AbortController();
    void fetchPublications(controller.signal);
    void fetchRequests(controller.signal);
    return () => controller.abort();
  }, [fetchPublications, fetchRequests]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch) next.set('search', debouncedSearch);
    if (career) next.set('career', career);
    setSearchParams(next, { replace: true });
  }, [career, debouncedSearch, setSearchParams]);

  const profiles = useMemo(() => {
    const map = new Map<number, ProfileSummary>();
    if (user) {
      map.set(user.id, {
        id: user.id,
        name: `${user.name} ${user.lastName}`,
        career: user.career,
        rating: user.rating,
      });
    }
    publications.forEach((publication) => {
      if (!map.has(publication.authorId)) {
        map.set(publication.authorId, {
          id: publication.authorId,
          name: `Estudiante UTEC #${publication.authorId}`,
          career: null,
          rating: null,
        });
      }
    });
    requests.forEach((request) => {
      if (request.requesterName || request.requesterCareer || request.requesterRating != null) {
        map.set(request.requesterId, {
          id: request.requesterId,
          name: request.requesterName || `Estudiante UTEC #${request.requesterId}`,
          career: request.requesterCareer ?? null,
          rating: request.requesterRating ?? null,
        });
      }
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [publications, requests, user]);

  const filtered = useMemo(() => profiles.filter((profile) => {
    if (career && profile.career !== career) return false;
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      const text = `${profile.name} ${profile.id} ${profile.career ?? ''}`.toLowerCase();
      if (!text.includes(term)) return false;
    }
    return true;
  }), [career, debouncedSearch, profiles]);

  const loading = loadingPublications || loadingRequests;

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>Perfiles</h1>
          <p>Busca estudiantes por nombre, codigo o carrera.</p>
        </div>
      </section>

      <section className="filter-panel compact">
        <label>
          Buscar
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, correo o codigo" />
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
                <p>{profile.career ? profile.career.replace(/_/g, ' ') : 'Perfil disponible por publicaciones'}</p>
                <span>{formatRating(profile.rating)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
