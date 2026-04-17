import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/ui/AuthCard";
import { FieldGroup } from "../components/ui/FieldGroup";
import { FormNotice } from "../components/ui/FormNotice";
import { useAuthStore } from "../store/auth.store";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [form, setForm] = useState({
    email: location.state?.email || "",
    otp: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await resetPassword(form);
    setMessage("Password updated successfully.");
    navigate("/login", { state: { email: form.email } });
  };

  return (
    <AuthCard
      eyebrow="Reset Password"
      title="Choose a new password"
      description="Use the OTP from your email and set a stronger password for your account."
      footer={
        <span>
          Need to restart?{" "}
          <Link className="font-semibold text-brand-700" to="/forgot-password">
            Request a fresh OTP
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
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
          label="OTP code"
          name="otp"
          value={form.otp}
          onChange={handleChange}
          placeholder="Enter reset OTP"
        />
        <FieldGroup
          label="New password"
          name="newPassword"
          type="password"
          value={form.newPassword}
          onChange={handleChange}
          placeholder="Set a new password"
        />
        <button
          className="btn-primary w-full"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </AuthCard>
  );
}
