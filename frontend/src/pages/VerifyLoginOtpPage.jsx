import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/ui/AuthCard";
import { FieldGroup } from "../components/ui/FieldGroup";
import { FormNotice } from "../components/ui/FormNotice";
import { useAuthStore } from "../store/auth.store";

export function VerifyLoginOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const verifyLoginOtp = useAuthStore((state) => state.verifyLoginOtp);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [form, setForm] = useState({
    email: location.state?.email || "",
    otp: "",
  });

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
    const response = await verifyLoginOtp(form);

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

  return (
    <AuthCard
      eyebrow="OTP Login"
      title="Complete your sign-in"
      description="Enter the one-time password sent to your email to continue into AuthCore."
      footer={
        <span>
          Need to restart?{" "}
          <Link className="font-semibold text-brand-700" to="/login">
            Return to login
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
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
          placeholder="Enter 6-digit OTP"
        />
        <button
          className="btn-primary w-full"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Verifying..." : "Verify and continue"}
        </button>
      </form>
    </AuthCard>
  );
}
