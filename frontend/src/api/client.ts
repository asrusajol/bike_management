import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const { refreshToken, setTokens, clearTokens } = useAuthStore.getState();
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });
          setTokens(data.access_token, data.refresh_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return apiClient(error.config);
        } catch {
          clearTokens();
        }
      } else {
        clearTokens();
      }
    }
    return Promise.reject(error);
  },
);
