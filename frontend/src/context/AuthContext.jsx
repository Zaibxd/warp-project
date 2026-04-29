import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { clearStoredAuth, getStoredAuth, setStoredAuth } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [user, setUser] = useState(() => getStoredAuth()?.user || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const existing = getStoredAuth();
      if (!existing?.access) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me/");
        const nextAuth = { ...existing, user: data };
        setStoredAuth(nextAuth);
        setAuth(nextAuth);
        setUser(data);
      } catch {
        clearStoredAuth();
        setAuth(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async ({ username, password }) => {
    const { data } = await api.post("/auth/login/", { username, password });
    const nextAuth = {
      access: data.access,
      refresh: data.refresh,
      user: data.user,
    };
    setStoredAuth(nextAuth);
    setAuth(nextAuth);
    setUser(data.user);
    return data.user;
  };

  const signup = async ({ username, email, password, confirmPassword }) => {
    const { data } = await api.post("/auth/register/", {
      username,
      email,
      password,
      confirm_password: confirmPassword,
    });
    const nextAuth = {
      access: data.access,
      refresh: data.refresh,
      user: data.user,
    };
    setStoredAuth(nextAuth);
    setAuth(nextAuth);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearStoredAuth();
    setAuth(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await api.get("/auth/me/");
    const existing = getStoredAuth();
    const nextAuth = { ...(existing || {}), user: data };
    setStoredAuth(nextAuth);
    setAuth(nextAuth);
    setUser(data);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(auth?.access),
      isAdmin: Boolean(user?.is_staff),
      login,
      signup,
      logout,
      refreshUser,
    }),
    [auth?.access, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
