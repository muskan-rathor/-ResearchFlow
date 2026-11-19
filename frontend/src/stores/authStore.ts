
import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("researchflow_token"),
  user: JSON.parse(
    localStorage.getItem("researchflow_user") || "null"
  ),

  login: (token, user) => {
    localStorage.setItem("researchflow_token", token);
    localStorage.setItem("researchflow_user", JSON.stringify(user));

    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem("researchflow_token");
    localStorage.removeItem("researchflow_user");

    set({ token: null, user: null });
  },
}));
