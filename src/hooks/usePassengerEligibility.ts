import { MyRide } from './useRides';
import { RequestPublication } from '../types/requestPublication';

const MAX_ACTIVE_REQUESTS = 2;

export const usePassengerEligibility = (
  requests: RequestPublication[],
  myRides: MyRide[],
  userId: number | null,
  publicationId?: number,
) => {
  const mine = requests.filter((request) => request.requesterId === userId && !request.requesterIsDriver);
  const pendingRequests = mine.filter((request) => request.status === 'PENDING');
  const acceptedRequests = mine.filter((request) => request.status === 'ACCEPTED');
  const hasConfirmedRide = acceptedRequests.length > 0 || myRides.some((entry) => entry.role === 'passenger');
  const existingRequest = publicationId == null
    ? undefined
    : mine.find((request) => request.publicationId === publicationId && ['PENDING', 'ACCEPTED'].includes(request.status));
  const reachedRequestLimit = pendingRequests.length >= MAX_ACTIVE_REQUESTS;

  let blockReason: string | null = null;
  if (hasConfirmedRide) blockReason = 'Ya tienes un viaje confirmado.';
  else if (existingRequest) blockReason = 'Ya solicitaste este viaje.';
  else if (reachedRequestLimit) blockReason = 'Ya tienes 2 solicitudes activas. Cancela una para solicitar otro viaje.';

  return {
    activeRequestCount: pendingRequests.length,
    existingRequest,
    hasConfirmedRide,
    reachedRequestLimit,
    canRequest: blockReason == null,
    blockReason,
  };
};
