import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/ui/AuthCard";
import { FieldGroup } from "../components/ui/FieldGroup";
import { FormNotice } from "../components/ui/FormNotice";
import { useAuthStore } from "../store/auth.store";

export function VerifyRegistrationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const resendVerificationOtpForEmail = useAuthStore((state) => state.resendVerificationOtpForEmail);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [form, setForm] = useState({
    email: location.state?.email || "",
    otp: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await verifyOtp(form);
    setMessage("Account verified. Redirecting to your dashboard...");
    navigate("/dashboard");
  };

  const handleResend = async () => {
    const response = await resendVerificationOtpForEmail(form.email);
    setMessage(response.message || "A fresh OTP has been sent.");
  };

  return (
    <AuthCard
      eyebrow="Verify Email"
      title="Confirm your registration"
      description="Enter the OTP from your inbox to activate your account and continue straight into your dashboard."
      footer={
        <span>
          Need a different email? <Link className="font-semibold text-brand-700" to="/register">Go back</Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormNotice type="success" message={message} />
        <FormNotice type="error" message={error} />
        <FieldGroup label="Email address" name="email" type="email" value={form.email} onChange={handleChange} placeholder="aman@example.com" />
        <FieldGroup label="OTP code" name="otp" value={form.otp} onChange={handleChange} placeholder="Enter 6-digit OTP" />
        <button className="btn-primary w-full" type="submit" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Verify account"}
        </button>
        <button className="btn-secondary w-full" type="button" disabled={isLoading || !form.email} onClick={handleResend}>
          {isLoading ? "Sending..." : "Resend OTP"}
        </button>
      </form>
    </AuthCard>
  );
}
