import { useState, useCallback } from 'react';
import { RequestPublication } from '../types/requestPublication';
import { requestPublicationService } from '../services/requestPublication';
import { AppError } from '../types/apiError';

export const useRequests = () => {
  const [requests, setRequests] = useState<RequestPublication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetch = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestPublicationService.getAllWithSignal(signal);
      setRequests(data);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e as AppError);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  return { requests, setRequests, loading, error, fetch };
};
