import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import * as api from "../api/client";
import type { User } from "../api/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "jobneed:token";

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readToken());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.setAuthToken(token);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then(setUser)
      .catch(() => {
        setToken(null);
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          // ignore
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  function persistSession(newToken: string, newUser: User) {
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
    } catch {
      // private mode / quota — session still works for this tab
    }
    setToken(newToken);
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    persistSession(res.access_token, res.user);
  }

  async function register(email: string, password: string) {
    const res = await api.register(email, password);
    persistSession(res.access_token, res.user);
  }

  function logout() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
