import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

const navItems = [
  { label: "Overview", to: "/dashboard" },
  { label: "Sessions", to: "/sessions" },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-sand px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="panel mb-6 flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-brand-700">AuthCore Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-950">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button className="btn-secondary" onClick={handleLogout} disabled={isLoading}>
              Logout
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
