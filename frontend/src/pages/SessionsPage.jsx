import { useEffect } from "react";
import { useAuthStore } from "../store/auth.store";
import { FormNotice } from "../components/ui/FormNotice";

export function SessionsPage() {
  const sessions = useAuthStore((state) => state.sessions);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const fetchSessions = useAuthStore((state) => state.fetchSessions);
  const logoutAllDevices = useAuthStore((state) => state.logoutAllDevices);
  const logoutSession = useAuthStore((state) => state.logoutSession);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="grid gap-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-brand-700">Device Sessions</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink-950">Track active devices</h2>
          </div>

          <button className="btn-secondary" onClick={logoutAllDevices} disabled={isLoading}>
            Logout all devices
          </button>
        </div>

        <div className="mt-6">
          <FormNotice type="error" message={error} />
        </div>

        <div className="mt-6 grid gap-4">
          {sessions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50 px-5 py-8 text-sm text-ink-800">
              No session metadata available yet.
            </div>
          ) : (
            sessions.map((session, index) => (
              <div key={`${session.createdAt}-${index}`} className="rounded-3xl border border-brand-100 bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm font-semibold text-ink-950">
                    Session {index + 1} {session.isCurrent ? "(Current)" : ""}
                  </p>
                  {!session.isCurrent ? (
                    <button
                      className="btn-secondary"
                      onClick={() => logoutSession(session.id)}
                      disabled={isLoading}
                      type="button"
                    >
                      Revoke session
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 text-sm text-ink-800 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-brand-700">IP</p>
                    <p className="mt-1">{session.ip || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-brand-700">Device</p>
                    <p className="mt-1 break-all">{session.userAgent || "Unknown agent"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-brand-700">Started</p>
                    <p className="mt-1">
                      {session.createdAt ? new Date(session.createdAt).toLocaleString() : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
