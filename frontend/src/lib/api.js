import axios from "axios";

const DEFAULT_DEV_API_URL = "http://localhost:5000/api/v1";

export const API_BASE_URL = import.meta.env.DEV
  ? DEFAULT_DEV_API_URL
  : import.meta.env.VITE_API_URL?.trim();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        await api.post("/auth/refresh");
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
