export type UserRole = 'picker' | 'manager' | 'admin' | 'other';

export interface User {
  id: string;
  email: string;
  login: string;
  role: UserRole;
  store_id?: string;
  created_at?: Date;
}
