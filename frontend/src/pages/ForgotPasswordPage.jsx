import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/ui/AuthCard";
import { FieldGroup } from "../components/ui/FieldGroup";
import { FormNotice } from "../components/ui/FormNotice";
import { useAuthStore } from "../store/auth.store";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    await forgotPassword({ email });
    setMessage("Password reset OTP sent.");
    navigate("/reset-password", { state: { email } });
  };

  return (
    <AuthCard
      eyebrow="Recovery"
      title="Reset access securely"
      description="Start a password reset by requesting an OTP for your registered email address."
      footer={
        <span>
          Remembered it?{" "}
          <Link className="font-semibold text-brand-700" to="/login">
            Back to login
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="aman@example.com"
        />
        <button
          className="btn-primary w-full"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Sending OTP..." : "Send reset OTP"}
        </button>
      </form>
    </AuthCard>
  );
}
