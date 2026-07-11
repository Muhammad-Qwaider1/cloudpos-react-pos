import { create } from 'zustand';
import api from '../api/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'STOCK_MANAGER' | 'CASHIER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

// 30-minute inactivity timeout
const TIMEOUT_MS = 30 * 60 * 1000;
let inactivityTimer: ReturnType<typeof setTimeout>;

const resetTimer = () => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    localStorage.removeItem('cloudpos_token');
    localStorage.removeItem('cloudpos_user');
    window.location.href = '/login';
  }, TIMEOUT_MS);
};

['mousedown', 'keydown', 'touchstart', 'scroll'].forEach((event) => {
  document.addEventListener(event, resetTimer, { passive: true });
});

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user } = res.data;
      localStorage.setItem('cloudpos_token', access_token);
      localStorage.setItem('cloudpos_user', JSON.stringify(user));
      set({ user, token: access_token, isAuthenticated: true, loading: false });
      resetTimer();
    } catch (err: any) {
      const message = err.response?.data?.message;
      const errorMessage = Array.isArray(message)
        ? message.join(', ')
        : message || (err.code === 'ERR_NETWORK' ? 'Cannot connect to server' : 'Login failed');

      set({
        loading: false,
        error: errorMessage,
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('cloudpos_token');
    localStorage.removeItem('cloudpos_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  initialize: () => {
    const token = localStorage.getItem('cloudpos_token');
    const userStr = localStorage.getItem('cloudpos_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
        resetTimer();
      } catch {
        localStorage.removeItem('cloudpos_token');
        localStorage.removeItem('cloudpos_user');
      }
    }
  },
}));