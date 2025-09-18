import { create } from "zustand";

interface AuthState {
  user: { id: string; email: string; name: string } | null;
  setUser: (user: { id: string; email: string; name: string } | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
