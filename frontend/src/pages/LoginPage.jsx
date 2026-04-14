import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/ui/AuthCard";
import { FieldGroup } from "../components/ui/FieldGroup";
import { FormNotice } from "../components/ui/FormNotice";
import { useAuthStore } from "../store/auth.store";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginWithPassword = useAuthStore((state) => state.loginWithPassword);
  const requestLoginOtp = useAuthStore((state) => state.requestLoginOtp);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    await loginWithPassword(form);
    navigate("/dashboard");
  };

  const handleOtpLogin = async () => {
    await requestLoginOtp({ email: form.email });
    setMessage("OTP sent. Continue to verify your login.");
    navigate("/verify-login", { state: { email: form.email } });
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
      </form>
    </AuthCard>
  );
}
