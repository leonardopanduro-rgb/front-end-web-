import { useState, useCallback } from 'react';
import { Vehicle } from '../types/vehicle';
import { vehicleService } from '../services/vehicle';
import { AppError } from '../types/apiError';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetch = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await vehicleService.getAllWithSignal(signal);
      setVehicles(data);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e as AppError);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  return { vehicles, setVehicles, loading, error, fetch };
};
