import { useEffect } from "react";
import { useAuthStore } from "../store/auth.store";
import { FormNotice } from "../components/ui/FormNotice";

const getReadableIp = (ip) => {
  if (!ip) {
    return "Unknown";
  }

  return ip === "::1" ? "Localhost" : ip;
};

const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      browser: "Unknown browser",
      platform: "Unknown device",
    };
  }

  const browserMatchers = [
    { label: "Edge", pattern: /Edg\//i },
    { label: "Chrome", pattern: /Chrome\//i },
    { label: "Firefox", pattern: /Firefox\//i },
    { label: "Safari", pattern: /Safari\//i },
  ];

  const platformMatchers = [
    { label: "Windows", pattern: /Windows/i },
    { label: "macOS", pattern: /Mac OS X|Macintosh/i },
    { label: "Linux", pattern: /Linux/i },
    { label: "Android", pattern: /Android/i },
    { label: "iPhone", pattern: /iPhone/i },
    { label: "iPad", pattern: /iPad/i },
  ];

  const browser =
    browserMatchers.find((item) => item.pattern.test(userAgent))?.label ||
    "Unknown browser";
  const platform =
    platformMatchers.find((item) => item.pattern.test(userAgent))?.label ||
    "Unknown device";

  return { browser, platform };
};

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
            <p className="text-sm uppercase tracking-[0.22em] text-brand-700">
              Device Sessions
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-ink-950">
              Track active devices
            </h2>
          </div>

          <button
            className="btn-secondary"
            onClick={logoutAllDevices}
            disabled={isLoading}
          >
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
            sessions.map((session, index) => {
              const { browser, platform } = parseUserAgent(session.userAgent);

              return (
                <div
                  key={`${session.createdAt}-${index}`}
                  className="rounded-3xl border border-brand-100 bg-white p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-ink-950">
                          Session {index + 1}
                        </p>
                        {session.isCurrent ? (
                          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
                            Current device
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink-800">
                        {browser} on {platform}
                      </p>
                    </div>

                    {!session.isCurrent ? (
                      <button
                        className="btn-secondary shrink-0"
                        onClick={() => logoutSession(session.id)}
                        disabled={isLoading}
                        type="button"
                      >
                        Revoke session
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="min-w-0 rounded-2xl bg-brand-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-brand-700">
                        IP Address
                      </p>
                      <p className="mt-2 break-all text-sm font-medium text-ink-950">
                        {getReadableIp(session.ip)}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-2xl bg-brand-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-brand-700">
                        Device
                      </p>
                      <p className="mt-2 text-sm font-medium text-ink-950">
                        {browser} on {platform}
                      </p>
                      <p className="mt-2 wrap-break-word text-xs leading-5 text-ink-800">
                        {session.userAgent || "Unknown agent"}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-2xl bg-brand-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-brand-700">
                        Started
                      </p>
                      <p className="mt-2 text-sm font-medium text-ink-950">
                        {session.createdAt
                          ? new Date(session.createdAt).toLocaleString()
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
