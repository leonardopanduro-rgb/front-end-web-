import { useState, useCallback } from 'react';
import { Publication } from '../types/publication';
import { publicationService } from '../services/publication';
import { AppError } from '../types/apiError';

export const usePublications = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetch = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await publicationService.getAllWithSignal(signal);
      setPublications(data);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e as AppError);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  return { publications, loading, error, fetch };
};
