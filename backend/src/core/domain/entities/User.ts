import type { UserRole } from '../../../shared/types/index.js';

export interface User {
  userId: string;
  email: string;
  givenName: string;
  familyName: string;
  role: UserRole;
  studentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  userId: string;
  email: string;
  givenName: string;
  familyName: string;
  role: UserRole;
  studentId?: string;
}
