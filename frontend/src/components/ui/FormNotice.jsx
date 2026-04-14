export function FormNotice({ type = "info", message }) {
  if (!message) {
    return null;
  }

  const styles = {
    info: "border-brand-100 bg-brand-50 text-brand-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-red-200 bg-red-50 text-red-700",
  };

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[type]}`}>{message}</div>;
}
