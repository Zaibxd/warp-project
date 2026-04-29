import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
const AUTH_STORAGE_KEY = "coffee_auth";

export function getStoredAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(authData) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const stored = getStoredAuth();
  if (stored?.access) {
    config.headers.Authorization = `Bearer ${stored.access}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      const stored = getStoredAuth();
      if (stored?.refresh) {
        original._retry = true;
        try {
          if (!refreshPromise) {
            refreshPromise = axios
              .post(`${API_BASE_URL}/auth/refresh/`, {
                refresh: stored.refresh,
              })
              .then((res) => res.data)
              .finally(() => {
                refreshPromise = null;
              });
          }

          const refreshed = await refreshPromise;
          const nextAuth = { ...stored, access: refreshed.access };
          setStoredAuth(nextAuth);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${refreshed.access}`;
          return api(original);
        } catch {
          clearStoredAuth();
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
