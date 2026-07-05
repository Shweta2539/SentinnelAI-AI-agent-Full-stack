import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const TOKEN_STORAGE_KEY = "sentinelai_token";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const axiosClient = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
});

// --- Request interceptor: attach the JWT bearer token, if we have one ----
axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// --- Response interceptor: normalize errors, react to expired sessions ---
// A small pub/sub so AuthContext can react to a forced logout (401) without
// this module needing to import React or the context directly.
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

export interface NormalizedApiError {
  message: string;
  status: number | null;
}

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status ?? null;

    if (status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      unauthorizedHandler?.();
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong while talking to the server.";

    const normalized: NormalizedApiError = { message, status };
    return Promise.reject(normalized);
  }
);
