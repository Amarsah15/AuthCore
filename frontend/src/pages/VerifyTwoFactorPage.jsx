import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/ui/AuthCard";
import { FormNotice } from "../components/ui/FormNotice";
import { useAuthStore } from "../store/auth.store";

export function VerifyTwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const verifyTwoFactorLogin = useAuthStore(
    (state) => state.verifyTwoFactorLogin,
  );
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const queryToken = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("twoFactorToken") || "";
  }, [location.search]);

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const twoFactorToken = location.state?.twoFactorToken || queryToken;

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!twoFactorToken) {
      useAuthStore
        .getState()
        .setError("Missing 2FA session token. Login again.");
      return;
    }

    await verifyTwoFactorLogin({
      twoFactorToken,
      code,
    });

    setMessage("Two-factor verification successful.");
    navigate("/dashboard");
  };

  return (
    <AuthCard
      eyebrow="2FA"
      title="Confirm with your authenticator"
      description="Enter the 8-digit code from Google Authenticator or another TOTP app."
      footer={
        <span>
          Back to{" "}
          <Link className="font-semibold text-brand-700" to="/login">
            login
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormNotice type="success" message={message} />
        <FormNotice type="error" message={error} />

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-900">
            8-digit authenticator code
          </span>
          <input
            className="field"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="12345678"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
          />
        </label>

        <button
          className="btn-primary w-full"
          type="submit"
          disabled={isLoading || code.trim().length !== 8}
        >
          {isLoading ? "Verifying..." : "Verify and continue"}
        </button>
      </form>
    </AuthCard>
  );
}
