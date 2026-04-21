import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth.store";

const digitsOnly = (value, maxLength) =>
  value.replace(/\D/g, "").slice(0, maxLength);

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const verifyCurrentUserOtp = useAuthStore(
    (state) => state.verifyCurrentUserOtp,
  );
  const resendVerificationOtp = useAuthStore(
    (state) => state.resendVerificationOtp,
  );
  const twoFactorSetup = useAuthStore((state) => state.twoFactorSetup);
  const setupTwoFactor = useAuthStore((state) => state.setupTwoFactor);
  const enableTwoFactor = useAuthStore((state) => state.enableTwoFactor);
  const disableTwoFactor = useAuthStore((state) => state.disableTwoFactor);
  const clearError = useAuthStore((state) => state.clearError);
  const [otp, setOtp] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [message, setMessage] = useState("");
  const [twoFactorMessage, setTwoFactorMessage] = useState("");

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSendVerification = async () => {
    clearError();
    setMessage("");
    try {
      const response = await resendVerificationOtp();
      setMessage(response.message || "Verification OTP sent.");
    } catch {
      // Store-level error state already contains the API failure message.
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    clearError();
    setMessage("");
    try {
      const response = await verifyCurrentUserOtp(otp);
      setOtp("");
      setMessage(response.message || "Account verified successfully.");
    } catch {
      // Store-level error state already contains the API failure message.
    }
  };

  const handleStartTwoFactorSetup = async () => {
    clearError();
    setTwoFactorMessage("");
    try {
      const response = await setupTwoFactor();
      setTwoFactorMessage(
        response.message || "Scan the QR code to continue setup.",
      );
    } catch {
      // Store-level error state already contains the API failure message.
    }
  };

  const handleEnableTwoFactor = async (event) => {
    event.preventDefault();
    clearError();
    setTwoFactorMessage("");
    try {
      const response = await enableTwoFactor(twoFactorCode);
      setTwoFactorCode("");
      setTwoFactorMessage(
        response.message || "Two-factor authentication enabled.",
      );
    } catch {
      // Store-level error state already contains the API failure message.
    }
  };

  const handleDisableTwoFactor = async (event) => {
    event.preventDefault();
    clearError();
    setTwoFactorMessage("");
    try {
      const response = await disableTwoFactor(twoFactorCode);
      setTwoFactorCode("");
      setTwoFactorMessage(
        response.message || "Two-factor authentication disabled.",
      );
    } catch {
      // Store-level error state already contains the API failure message.
    }
  };

  return (
    <section className="panel overflow-hidden p-0">
      <div className="border-b border-brand-100 bg-[radial-gradient(circle_at_top_left,rgba(127,215,157,0.22),transparent_34%),linear-gradient(135deg,#f8fbf8_0%,#eefbf3_100%)] px-6 py-7 sm:px-8">
        <p className="text-sm uppercase tracking-[0.22em] text-brand-700">
          Overview
        </p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-ink-950 sm:text-4xl">
              Your account, polished and under control
            </h2>
            <p className="mt-3 text-sm leading-7 text-ink-800 sm:text-base">
              Review identity details, confirm your email status, and keep your
              access flow ready for production use.
            </p>
          </div>
          <div className="rounded-3xl border border-white/80 bg-white/80 px-5 py-4 shadow-[0_18px_40px_rgba(20,80,47,0.08)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-700">
              Account Role
            </p>
            <p className="mt-2 text-xl font-semibold text-ink-950">
              {user?.role || "user"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 rounded-4xl border border-brand-100 bg-white p-6 shadow-[0_18px_40px_rgba(20,80,47,0.06)]">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-700">
            Email
          </p>
          <p className="mt-4 overflow-hidden text-2xl font-semibold leading-tight text-ink-950 wrap-break-word">
            {user?.email || "Unavailable"}
          </p>
          <p className="mt-4 text-sm leading-6 text-ink-800">
            This address is used for OTP verification, login recovery, and
            device-aware authentication alerts.
          </p>
        </div>

        <div className="rounded-4xl border border-brand-100 bg-brand-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-700">
              Verification
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                user?.isVerified
                  ? "bg-brand-100 text-brand-800"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {user?.isVerified ? "Verified" : "Pending"}
            </span>
          </div>

          {user?.isVerified ? (
            <p className="mt-4 text-sm leading-6 text-ink-800">
              Your account is verified and ready for secure access across
              sessions and devices.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-sm leading-6 text-ink-800">
                Send a fresh OTP and confirm it here to complete verification
                without leaving the dashboard.
              </p>

              <button
                className="btn-secondary w-full"
                type="button"
                onClick={handleSendVerification}
                disabled={isLoading}
              >
                {isLoading ? "Sending code..." : "Send verification code"}
              </button>

              <form className="space-y-3" onSubmit={handleVerify}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink-900">
                    Verification OTP
                  </span>
                  <input
                    className="field"
                    name="otp"
                    value={otp}
                    onChange={(event) =>
                      setOtp(digitsOnly(event.target.value, 6))
                    }
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    inputMode="numeric"
                  />
                </label>

                <button
                  className="btn-primary w-full"
                  type="submit"
                  disabled={isLoading || otp.trim().length !== 6}
                >
                  {isLoading ? "Verifying..." : "Mark as verified"}
                </button>
              </form>

              {message ? (
                <p className="text-sm text-brand-800">{message}</p>
              ) : null}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          )}
        </div>

        <div className="rounded-4xl border border-brand-100 bg-white p-6 shadow-[0_18px_40px_rgba(20,80,47,0.06)] lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-brand-700">
                Two-Factor Authentication
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-ink-950">
                8-digit authenticator protection
              </h3>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                user?.twoFactorEnabled
                  ? "bg-brand-100 text-brand-800"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-ink-800">
            Compatible with Google Authenticator and other TOTP apps configured
            for 8-digit codes.
          </p>

          {twoFactorMessage ? (
            <p className="mt-4 text-sm text-brand-800">{twoFactorMessage}</p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

          {!user?.twoFactorEnabled ? (
            <div className="mt-5 space-y-4">
              <button
                className="btn-secondary"
                type="button"
                onClick={handleStartTwoFactorSetup}
                disabled={isLoading}
              >
                {isLoading ? "Preparing..." : "Start 2FA setup"}
              </button>

              {twoFactorSetup ? (
                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-3xl border border-brand-100 bg-brand-50 p-4">
                    <p className="text-sm font-medium text-ink-900">
                      Scan this QR code
                    </p>
                    {twoFactorSetup.qrCodeDataUrl ? (
                      <img
                        src={twoFactorSetup.qrCodeDataUrl}
                        alt="2FA QR code"
                        className="mt-3 w-full max-w-[220px] rounded-2xl border border-brand-100 bg-white p-2"
                      />
                    ) : null}
                  </div>

                  <form className="space-y-3" onSubmit={handleEnableTwoFactor}>
                    <p className="text-sm text-ink-800">
                      Manual key:{" "}
                      <span className="font-semibold text-ink-950">
                        {twoFactorSetup.manualKey}
                      </span>
                    </p>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-ink-900">
                        Enter your 8-digit code
                      </span>
                      <input
                        className="field"
                        value={twoFactorCode}
                        onChange={(event) =>
                          setTwoFactorCode(digitsOnly(event.target.value, 8))
                        }
                        placeholder="12345678"
                        maxLength={8}
                        inputMode="numeric"
                      />
                    </label>
                    <button
                      className="btn-primary"
                      type="submit"
                      disabled={isLoading || twoFactorCode.trim().length !== 8}
                    >
                      {isLoading ? "Enabling..." : "Enable 2FA"}
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ) : (
            <form
              className="mt-5 max-w-md space-y-3"
              onSubmit={handleDisableTwoFactor}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink-900">
                  Enter 8-digit code to disable
                </span>
                <input
                  className="field"
                  value={twoFactorCode}
                  onChange={(event) =>
                    setTwoFactorCode(digitsOnly(event.target.value, 8))
                  }
                  placeholder="12345678"
                  maxLength={8}
                  inputMode="numeric"
                />
              </label>
              <button
                className="btn-secondary"
                type="submit"
                disabled={isLoading || twoFactorCode.trim().length !== 8}
              >
                {isLoading ? "Disabling..." : "Disable 2FA"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
