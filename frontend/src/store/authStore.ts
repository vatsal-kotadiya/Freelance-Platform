import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'CLIENT' | 'FREELANCER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
      },
    }),
    {
      name: 'auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) localStorage.setItem('token', state.token);
      },
    }
  )
);
