'use client';

/**
 * Select component
 */
export default function Select({ label, id, error, helper, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--text)]">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full px-3 py-2 bg-[var(--panel2)] border ${
          error ? 'border-[var(--red)]' : 'border-[var(--border)]'
        } rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)] transition-colors appearance-none cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[var(--red)]">{error}</p>}
      {helper && !error && <p className="text-xs text-[var(--muted)]">{helper}</p>}
    </div>
  );
}
