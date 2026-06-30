import { useState, useCallback } from 'react';
import { Ride } from '../types/ride';
import { RidePassenger } from '../types/ridePassenger';
import { rideService } from '../services/ride';
import { ridePassengerService } from '../services/ridePassenger';
import { AppError } from '../types/apiError';

export interface MyRide {
  ride: Ride;
  role: 'driver' | 'passenger';
  passengerEntry?: RidePassenger;
}

export const useRides = (currentUserId: number | null) => {
  const [myRides, setMyRides] = useState<MyRide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetch = useCallback(async (signal?: AbortSignal) => {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);
    try {
      const [allRides, allPassengers] = await Promise.all([
        rideService.getAllWithSignal(signal),
        ridePassengerService.getAllWithSignal(signal),
      ]);
      const result: MyRide[] = [];
      for (const ride of allRides) {
        if (ride.driverId === currentUserId) {
          result.push({ ride, role: 'driver' });
        } else {
          const entry = allPassengers.find(
            p => p.rideId === ride.id && p.passengerId === currentUserId
          );
          if (entry) result.push({ ride, role: 'passenger', passengerEntry: entry });
        }
      }
      setMyRides(result);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e as AppError);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [currentUserId]);

  return { myRides, loading, error, fetch };
};
