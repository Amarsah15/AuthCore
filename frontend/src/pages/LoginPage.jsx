import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/ui/AuthCard";
import { FieldGroup } from "../components/ui/FieldGroup";
import { FormNotice } from "../components/ui/FormNotice";
import { useAuthStore } from "../store/auth.store";
import { API_BASE_URL } from "../lib/api";

const GoogleLogo = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-4 w-4"
    focusable="false"
  >
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.8 12 2.8 6.9 2.8 2.8 7 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.1-1.6H12z"
    />
    <path
      fill="#34A853"
      d="M2.8 7.7l3.2 2.3C6.8 8 9.1 6.2 12 6.2c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.8 12 2.8 8 2.8 4.5 5.1 2.8 7.7z"
    />
    <path
      fill="#4A90E2"
      d="M12 21.2c2.4 0 4.4-.8 5.8-2.2l-2.8-2.2c-.8.6-1.8 1-3 1-2.8 0-5.1-1.8-6-4.3l-3.2 2.5c1.6 3.7 5.2 6.2 9.2 6.2z"
    />
    <path
      fill="#FBBC05"
      d="M6 13.5c-.2-.5-.3-1-.3-1.5s.1-1 .3-1.5L2.8 8C2.2 9.2 1.8 10.6 1.8 12s.4 2.8 1 4l3.2-2.5z"
    />
  </svg>
);

const XLogo = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-4 w-4"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M17.9 3h3.4l-7.5 8.6L22.5 21h-6.8l-5.3-6.9L4.3 21H.9l8.1-9.2L1 3h7l4.8 6.3L17.9 3zm-1.2 16h1.9L7 4.9H5z"
    />
  </svg>
);

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginWithPassword = useAuthStore((state) => state.loginWithPassword);
  const requestLoginOtp = useAuthStore((state) => state.requestLoginOtp);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    clearError();

    const params = new URLSearchParams(location.search);
    const oauthError = params.get("oauthError");
    if (oauthError) {
      useAuthStore.getState().setError(oauthError);
    }
  }, [clearError, location.search]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    const response = await loginWithPassword(form);

    if (response?.requiresTwoFactor) {
      navigate("/verify-2fa", {
        state: {
          twoFactorToken: response.twoFactorToken,
          email: form.email,
        },
      });
      return;
    }

    navigate("/dashboard");
  };

  const handleOtpLogin = async () => {
    await requestLoginOtp({ email: form.email });
    setMessage("OTP sent. Continue to verify your login.");
    navigate("/verify-login", { state: { email: form.email } });
  };

  const startGoogleLogin = () => {
    const frontendOrigin = encodeURIComponent(window.location.origin);
    window.location.href = `${API_BASE_URL}/auth/oauth/google/start?frontendOrigin=${frontendOrigin}`;
  };

  const startXLogin = () => {
    const frontendOrigin = encodeURIComponent(window.location.origin);
    window.location.href = `${API_BASE_URL}/auth/oauth/x/start?frontendOrigin=${frontendOrigin}`;
  };

  return (
    <AuthCard
      eyebrow="Sign In"
      title="Secure access, your way"
      description="Use your password for direct login or request a one-time code for email-based sign-in."
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <Link className="font-semibold text-brand-700" to="/register">
            Create account
          </Link>
          <Link className="font-semibold text-brand-700" to="/forgot-password">
            Forgot password
          </Link>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handlePasswordLogin}>
        <FormNotice type="success" message={message} />
        <FormNotice type="error" message={error} />
        <FieldGroup
          label="Email address"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="aman@example.com"
        />
        <FieldGroup
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="btn-primary w-full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Login with password"}
          </button>
          <button
            className="btn-secondary w-full"
            type="button"
            onClick={handleOtpLogin}
            disabled={isLoading || !form.email}
          >
            Login with OTP
          </button>
        </div>
        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          <button
            className="btn-secondary w-full"
            type="button"
            onClick={startGoogleLogin}
            disabled={isLoading}
          >
            <GoogleLogo />
            <span className="ml-2">Continue with Google</span>
          </button>
          <button
            className="btn-secondary w-full"
            type="button"
            onClick={startXLogin}
            disabled={isLoading}
          >
            <XLogo />
            <span className="ml-2">Continue with X</span>
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
