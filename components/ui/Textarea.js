'use client';

/**
 * Textarea component
 */
export default function Textarea({ label, id, error, helper, rows = 4, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--text)]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`w-full px-3 py-2 bg-[var(--panel2)] border ${
          error ? 'border-[var(--red)]' : 'border-[var(--border)]'
        } rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)] transition-colors resize-y ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[var(--red)]">{error}</p>}
      {helper && !error && <p className="text-xs text-[var(--muted)]">{helper}</p>}
    </div>
  );
}
