import { create } from "zustand";
import { api, ensureCsrfToken } from "../lib/api";

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || fallback;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  sessions: [],
  accessToken: null,
  twoFactorSetup: null,
  csrfReady: false,
  isAuthenticated: false,
  isBootstrapping: true,
  isLoading: false,
  error: null,

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  hydrateAuth: async () => {
    set({ isBootstrapping: true, error: null });

    try {
      await ensureCsrfToken();
      const response = await api.get("/auth/me");

      set({
        csrfReady: true,
        user: response.data.data,
        isAuthenticated: true,
      });
    } catch {
      set({
        csrfReady: true,
        user: null,
        isAuthenticated: false,
        accessToken: null,
      });
    } finally {
      set({ isBootstrapping: false });
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/register", payload);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Registration failed");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/verify-otp", payload);
      set({
        accessToken: response.data.accessToken || null,
        user: response.data.data || null,
        isAuthenticated: true,
      });

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "OTP verification failed");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resendVerificationOtp: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/resend-verification", {});
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Unable to send verification OTP");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resendVerificationOtpForEmail: async (email) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/resend-verification", { email });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Unable to send verification OTP");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyCurrentUserOtp: async (otp) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/verify-current-user", { otp });
      set((state) => ({
        ...state,
        user: response.data.data || state.user,
      }));
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "OTP verification failed");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithPassword: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/login", payload);

      if (response.data?.requiresTwoFactor) {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });

        return response.data;
      }

      const me = await api.get("/auth/me");

      set({
        accessToken: response.data.accessToken,
        user: me.data.data,
        isAuthenticated: true,
      });

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Login failed");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  requestLoginOtp: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/login-otp", payload);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Unable to send OTP");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyLoginOtp: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/verify-login", payload);

      if (response.data?.requiresTwoFactor) {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });

        return response.data;
      }

      const me = await api.get("/auth/me");

      set({
        accessToken: response.data.accessToken,
        user: me.data.data,
        isAuthenticated: true,
      });

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Login verification failed");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyTwoFactorLogin: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/2fa/verify", payload);
      const me = await api.get("/auth/me");

      set({
        accessToken: response.data.accessToken,
        user: me.data.data,
        isAuthenticated: true,
      });

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Two-factor verification failed");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setupTwoFactor: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/2fa/setup");
      set({ twoFactorSetup: response.data.data || null });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Unable to start 2FA setup");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  enableTwoFactor: async (code) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/2fa/enable", { code });
      const me = await api.get("/auth/me");
      set({
        user: me.data.data,
        twoFactorSetup: null,
      });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Unable to enable 2FA");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  disableTwoFactor: async (code) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/2fa/disable", { code });
      const me = await api.get("/auth/me");
      set({ user: me.data.data });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Unable to disable 2FA");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  forgotPassword: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/forgot-password", payload);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Unable to start password reset");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post("/auth/reset-password", payload);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, "Password reset failed");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSessions: async () => {
    set({ error: null });

    try {
      const response = await api.get("/auth/sessions");
      set({ sessions: response.data.sessions || [] });
      return response.data.sessions || [];
    } catch (error) {
      const message = getErrorMessage(error, "Unable to load sessions");
      set({ error: message });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await api.post("/auth/logout");
    } catch (error) {
      const message = getErrorMessage(error, "Logout failed");
      set({ error: message });
    } finally {
      set({
        user: null,
        sessions: [],
        accessToken: null,
        twoFactorSetup: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logoutAllDevices: async () => {
    set({ isLoading: true, error: null });

    try {
      await api.post("/auth/logout-all");
    } catch (error) {
      const message = getErrorMessage(error, "Unable to logout all devices");
      set({ error: message });
    } finally {
      set({
        user: null,
        sessions: [],
        accessToken: null,
        twoFactorSetup: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logoutSession: async (sessionId) => {
    set({ isLoading: true, error: null });

    try {
      await api.post("/auth/logout-session", { sessionId });
      await get().fetchSessions();
    } catch (error) {
      const message = getErrorMessage(error, "Unable to remove session");
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
