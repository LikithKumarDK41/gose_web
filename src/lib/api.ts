import axios, { InternalAxiosRequestConfig } from "axios";

// Use relative API base (Next.js proxy will forward)
const API_BASE = "/api";   // ✅ not NEXT_PUBLIC_API_URL

const LOCALE_STORAGE_KEY = "site_locale";
const DEFAULT_LOCALE = "ja";

function getLocale(): string {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  return (
    localStorage.getItem(LOCALE_STORAGE_KEY) ||
    document.documentElement.getAttribute("lang") ||
    DEFAULT_LOCALE
  );
}

const api = axios.create({
  baseURL: API_BASE,  // ✅ relative, avoids CORS
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("user");
      const locale = getLocale();

      (config.headers as Record<string, string>)["Accept-Language"] = locale;
      (config.headers as Record<string, string>)["locale"] = locale;

      if (token) {
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default api;
