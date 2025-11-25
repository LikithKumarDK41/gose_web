import axios, { InternalAxiosRequestConfig } from "axios";

// ✅ Relative base for Next.js API proxy
const API_BASE = "/api";
const LOCALE_STORAGE_KEY = "site_locale";
const DEFAULT_LOCALE = "ja";

/* ------------------------------------------------------------
   🌐 Get current locale
------------------------------------------------------------ */
function getLocale(): string {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  return (
    localStorage.getItem(LOCALE_STORAGE_KEY) ||
    document.documentElement.getAttribute("lang") ||
    DEFAULT_LOCALE
  );
}

/* ------------------------------------------------------------
   🔐 Extract token from auth_user.user.token
------------------------------------------------------------ */
function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) {
      console.warn("⚠️ auth_user not found in localStorage");
      return null;
    }

    const parsed = JSON.parse(raw);
    const token = parsed?.user?.token;

    if (token) {
      return token;
    }

    console.warn("⚠️ No token found inside auth_user.user.token");
    return null;
  } catch (err) {
    console.error("❌ Failed to parse auth_user:", err);
    return null;
  }
}

/* ------------------------------------------------------------
   🚀 Axios instance
------------------------------------------------------------ */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

/* ------------------------------------------------------------
   📤 Request Interceptor
------------------------------------------------------------ */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = getAuthToken();
      const locale = getLocale();

      (config.headers as Record<string, string>)["Accept-Language"] = locale;
      (config.headers as Record<string, string>)["locale"] = locale;

      if (token) {
        (config.headers as Record<string, string>)["Authorization"] = token;
      } else {
        console.warn("🚫 No Authorization token attached");
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ------------------------------------------------------------
   📥 Response Interceptor
------------------------------------------------------------ */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      console.warn("🚫 401 Unauthorized — clearing auth_user");
      localStorage.removeItem("auth_user");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default api;
