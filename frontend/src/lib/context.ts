import { createContextId } from '@builder.io/qwik';
import type { User } from './types';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export const AuthContext = createContextId<AuthState>('auth.context');

export interface ThemeState {
  isDark: boolean;
}

export const ThemeContext = createContextId<ThemeState>('theme.context');
