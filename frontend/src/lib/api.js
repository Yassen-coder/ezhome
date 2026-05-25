import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

if (!BACKEND_URL) {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[EzHome] REACT_APP_BACKEND_URL is not set. API requests will fail until it is configured in Netlify."
    );
  } else {
    console.warn(
      "[EzHome] REACT_APP_BACKEND_URL is missing. Set it in frontend/.env for local development."
    );
  }
}

export const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

export const api = axios.create({ baseURL: API });

const TOKEN_KEY = "ezhome-admin-jwt";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler — clear token, send to login
let onUnauthorized = null;
export const setUnauthorizedHandler = (cb) => { onUnauthorized = cb; };

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      setToken(null);
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export const getAffiliateClickUrl = (productId) => `${API}/click/${productId}`;

// Format FastAPI error detail (may be string, array, or object) for safe rendering
export const formatApiError = (detail) => {
  if (detail == null) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};
