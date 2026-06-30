import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingState } from '../components/LoadingState';
import { SectionHeader } from '../components/SectionHeader';
import { TripCard } from '../components/TripCard';
import { useAuth } from '../hooks/useAuth';
import { publicationService } from '../services/publication';
import { AppError } from '../types/apiError';
import { Publication } from '../types/publication';
import { requestPublicationService } from '../services/requestPublication';
import { formatRating } from '../utils/formatters';

interface ProfileSummary {
  id: number;
  name: string;
  career: string | null;
  cycle: number | null;
  email: string | null;
  phone: string | null;
  studentCode: string | null;
  rating: number | null;
}

export const PublicProfilePage = () => {
  const { userId } = useParams();
  const id = Number(userId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedPublications, loadedRequests] = await Promise.all([
        publicationService.getAll(),
        requestPublicationService.getAll(),
      ]);
      const requestProfile = loadedRequests.find((request) => request.requesterId === id && (request.requesterName || request.requesterCareer || request.requesterRating != null));
      const currentUserProfile = user?.id === id ? {
        id: user.id,
        name: `${user.name} ${user.lastName}`,
        career: user.career,
        cycle: user.cycle,
        email: user.email,
        phone: user.phone,
        studentCode: user.studentCode,
        rating: user.rating,
      } : null;
      setProfile(currentUserProfile ?? {
        id,
        name: requestProfile?.requesterName || `Estudiante UTEC #${id}`,
        career: requestProfile?.requesterCareer ?? null,
        cycle: null,
        email: null,
        phone: null,
        studentCode: null,
        rating: requestProfile?.requesterRating ?? null,
      });
      setPublications(loadedPublications.filter((pub) => pub.authorId === id && pub.fromUTEC && pub.driverToPassenger));
    } catch (err) {
      setError(err as AppError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id, user]);

  if (loading) return <LoadingState message="Cargando perfil..." />;
  if (error) return <ErrorMessage error={error} onRetry={() => void load()} />;
  if (!profile) return null;

  return (
    <div className="page-stack">
      <section className="profile-header">
        <div className="avatar">{profile.name.slice(0, 2).toUpperCase()}</div>
        <div>
          <h1>{profile.name}</h1>
          <p>{profile.career ? profile.career.replace(/_/g, ' ') : 'Perfil de estudiante'}{profile.cycle ? ` - ciclo ${profile.cycle}` : ''}</p>
          <strong>{formatRating(profile.rating)}</strong>
        </div>
      </section>

      <section className="card">
        <dl className="info-list">
          <div><dt>Codigo</dt><dd>{profile.studentCode ?? `#${profile.id}`}</dd></div>
          <div><dt>Correo</dt><dd>{profile.email ?? 'No disponible'}</dd></div>
          <div><dt>Telefono</dt><dd>{profile.phone ?? 'No disponible'}</dd></div>
        </dl>
      </section>

      <section className="page-stack">
        <SectionHeader title="Viajes publicados" />
        {publications.length === 0 ? (
          <EmptyState title="Sin viajes publicados" subtitle="Este estudiante todavia no tiene viajes disponibles." />
        ) : (
          <div className="cards-grid">
            {publications.map((pub) => <TripCard key={pub.id} pub={pub} onClick={() => navigate(`/trips/${pub.id}`)} />)}
          </div>
        )}
      </section>
    </div>
  );
};
