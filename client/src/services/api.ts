import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("deepx_token") || localStorage.getItem("immigra_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle unauthenticated responses gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("deepx_token");
      localStorage.removeItem("immigra_token");
      // If we are not on the login or verify pages, redirect to login
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/verify-invoice")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
