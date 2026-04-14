import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-sand text-ink-900">
      <div className="absolute inset-0 bg-auth-grid bg-[size:36px_36px] opacity-50" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-100/70 blur-3xl" />

      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden px-10 py-14 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-brand-200 bg-white/70 px-4 py-2 text-sm font-medium text-brand-800">
              AuthCore
            </div>
            <h1 className="mt-8 max-w-xl text-5xl font-semibold leading-tight text-ink-950">
              Build trust into every sign-in, reset, session, and device.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink-800">
              Production-style authentication flows with secure cookies, CSRF protection,
              device tracking, and clean user journeys.
            </p>
          </div>

          <div className="panel max-w-xl p-6">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-700">
              Security Layers
            </p>
            <div className="mt-4 grid gap-3 text-sm text-ink-800">
              <div className="rounded-2xl bg-brand-50 px-4 py-4">JWT rotation and session tracking</div>
              <div className="rounded-2xl bg-brand-50 px-4 py-4">CSRF and cookie-based protection</div>
              <div className="rounded-2xl bg-brand-50 px-4 py-4">Audit logs and device visibility</div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-xl">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
}
