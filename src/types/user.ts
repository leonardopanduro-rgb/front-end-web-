export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  studentCode: string;
  career: string;
  cycle: number;
  rating: number | null;
  role: UserRole;
}

/** Vista publica de un usuario (sin datos sensibles). Endpoint: GET /users/{id}/public */
export interface PublicUser {
  id: number;
  name: string;
  lastName: string;
  career: string | null;
  rating: number | null;
}