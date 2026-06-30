import api from './api';
import { RequestPublication, RequestPublicationRequest, AcceptRequest, RequestStatus } from '../types/requestPublication';
import { parseAxiosError } from '../utils/errorMessages';

type BackendRequest = Omit<RequestPublication, 'status'> & { status: RequestStatus | 'COUNTERED' };

const normalizeRequest = (request: BackendRequest): RequestPublication => ({
  ...request,
  status: request.status === 'COUNTERED' ? 'PENDING' : request.status,
  legacyCountered: request.status === 'COUNTERED',
});

export const requestPublicationService = {
  create: async (publicationId: number, data: RequestPublicationRequest): Promise<RequestPublication> => {
    try { const r = await api.post<BackendRequest>(`/publications/${publicationId}/requests`, data); return normalizeRequest(r.data); }
    catch (e) { throw parseAxiosError(e); }
  },
  getAll: async (): Promise<RequestPublication[]> => {
    try { const r = await api.get<BackendRequest[]>('/request-publications'); return r.data.map(normalizeRequest); }
    catch (e) { throw parseAxiosError(e); }
  },
  getAllWithSignal: async (signal?: AbortSignal): Promise<RequestPublication[]> => {
    try { const r = await api.get<BackendRequest[]>('/request-publications', { signal }); return r.data.map(normalizeRequest); }
    catch (e) { throw parseAxiosError(e); }
  },
  getById: async (id: number): Promise<RequestPublication> => {
    try { const r = await api.get<BackendRequest>(`/request-publications/${id}`); return normalizeRequest(r.data); }
    catch (e) { throw parseAxiosError(e); }
  },
  cancel: async (id: number): Promise<RequestPublication> => {
    try { const r = await api.patch<BackendRequest>(`/request-publications/${id}/cancel`); return normalizeRequest(r.data); }
    catch (e) { throw parseAxiosError(e); }
  },
  accept: async (id: number, data: AcceptRequest): Promise<RequestPublication> => {
    try { const r = await api.patch<BackendRequest>(`/request-publications/${id}/accept`, data); return normalizeRequest(r.data); }
    catch (e) { throw parseAxiosError(e); }
  },
  reject: async (id: number): Promise<RequestPublication> => {
    try { const r = await api.patch<BackendRequest>(`/request-publications/${id}/reject`); return normalizeRequest(r.data); }
    catch (e) { throw parseAxiosError(e); }
  },
};
