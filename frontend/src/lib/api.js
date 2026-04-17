import axios from "axios";

export const API_BASE_URL = "http://localhost:5000/api/v1";
export const API_ORIGIN = new URL(API_BASE_URL).origin;

let csrfToken = null;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const setCsrfToken = (token) => {
  csrfToken = token;
};

export const ensureCsrfToken = async () => {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await axios({
    baseURL: API_ORIGIN,
    method: "get",
    url: "/api/csrf-token",
    withCredentials: true,
  });

  csrfToken = response.data.csrfToken;
  return csrfToken;
};

api.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase();
  const needsCsrf = method && !["GET", "HEAD", "OPTIONS"].includes(method);

  if (needsCsrf) {
    const token = await ensureCsrfToken();
    config.headers["x-csrf-token"] = token;
  }

  return config;
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
