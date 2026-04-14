import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export function NotFoundPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="panel overflow-hidden p-0">
      <div className="bg-[radial-gradient(circle_at_top_left,rgba(127,215,157,0.24),transparent_34%),linear-gradient(135deg,#f8fbf8_0%,#eefbf3_100%)] px-6 py-8 sm:px-8">
        <p className="text-sm uppercase tracking-[0.22em] text-brand-700">404</p>
        <h1 className="mt-4 text-4xl font-semibold text-ink-950 sm:text-5xl">This page slipped out of session</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-800 sm:text-base">
          The link is missing or no longer available. You can jump back to a safe route and keep moving.
        </p>
      </div>

      <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-[0_18px_40px_rgba(20,80,47,0.06)]">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-700">What You Can Do</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-ink-800">
            <div className="rounded-2xl bg-brand-50 px-4 py-4">Check the URL for a typo.</div>
            <div className="rounded-2xl bg-brand-50 px-4 py-4">Open a known route like login, dashboard, or sessions.</div>
            <div className="rounded-2xl bg-brand-50 px-4 py-4">Use the button below to get back into the app immediately.</div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-brand-100 bg-brand-50 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-700">Quick Return</p>
          <p className="mt-4 text-sm leading-6 text-ink-800">
            Choose the best next step for your current session.
          </p>

          <div className="mt-6 grid gap-3">
            <Link className="btn-primary w-full" to={isAuthenticated ? "/dashboard" : "/login"}>
              {isAuthenticated ? "Go to dashboard" : "Go to login"}
            </Link>
            <Link className="btn-secondary w-full" to={isAuthenticated ? "/sessions" : "/register"}>
              {isAuthenticated ? "Open sessions" : "Create account"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
