export function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <div className="panel p-6 sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-ink-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-ink-800">{description}</p>
      </div>

      <div className="mt-8">{children}</div>

      {footer ? <div className="mt-6 text-sm text-ink-700">{footer}</div> : null}
    </div>
  );
}
