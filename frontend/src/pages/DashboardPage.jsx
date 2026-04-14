import { useAuthStore } from "../store/auth.store";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const cards = [
    {
      label: "Role",
      value: user?.role || "user",
    },
    {
      label: "Verification",
      value: user?.isVerified ? "Verified" : "Pending",
    },
    {
      label: "Email",
      value: user?.email || "Unavailable",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="panel p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-brand-700">Overview</p>
        <h2 className="mt-3 text-3xl font-semibold text-ink-950">Security-first account center</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-800">
          This dashboard is wired for cookie-based auth, CSRF-aware requests, and backend-backed
          session visibility. It is a strong base for admin panels, user settings, and device controls.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-3xl bg-brand-50 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-700">{card.label}</p>
              <p className="mt-3 text-lg font-semibold text-ink-950">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <aside className="panel p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-brand-700">What is next</p>
        <div className="mt-4 space-y-3 text-sm leading-7 text-ink-800">
          <div className="rounded-2xl bg-white px-4 py-4">Add role-aware navigation and admin-only screens.</div>
          <div className="rounded-2xl bg-white px-4 py-4">Use the Sessions page to review active devices and revoke older sessions.</div>
          <div className="rounded-2xl bg-white px-4 py-4">Layer form validation and toast notifications for production polish.</div>
        </div>
      </aside>
    </div>
  );
}
