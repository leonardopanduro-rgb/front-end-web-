import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingState } from '../components/LoadingState';
import { SectionHeader } from '../components/SectionHeader';
import { TripCard } from '../components/TripCard';
import { publicationService } from '../services/publication';
import { userService } from '../services/user';
import { AppError } from '../types/apiError';
import { Publication } from '../types/publication';
import { PublicUser } from '../types/user';
import { formatName, formatRating } from '../utils/formatters';

export const PublicProfilePage = () => {
  const { userId } = useParams();
  const id = Number(userId);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedProfile, loadedPublications] = await Promise.all([
        userService.getPublicById(id),
        publicationService.getAll(),
      ]);
      setProfile(loadedProfile);
      setPublications(loadedPublications.filter((pub) => pub.authorId === id && pub.fromUTEC && pub.driverToPassenger));
    } catch (err) {
      setError(err as AppError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (loading) return <LoadingState message="Cargando perfil..." />;
  if (error) return <ErrorMessage error={error} onRetry={() => void load()} />;
  if (!profile) return null;

  const fullName = formatName(`${profile.name} ${profile.lastName}`.trim());

  return (
    <div className="page-stack">
      <section className="profile-header">
        <div className="avatar">{fullName.slice(0, 2).toUpperCase()}</div>
        <div>
          <h1>{fullName}</h1>
          <p>{profile.career ? profile.career.replace(/_/g, ' ') : 'Estudiante UTEC'}</p>
          <strong>{formatRating(profile.rating)}</strong>
        </div>
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
