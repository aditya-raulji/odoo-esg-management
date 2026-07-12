'use client';

/**
 * Button component with module-accent variants
 * Variants: primary (default blue), green, purple, orange, edit (orange), danger (red), ghost
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg border transition-all duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const variants = {
    primary:
      'bg-[var(--blue)] border-[var(--blue)] text-white hover:bg-blue-500 focus-visible:ring-[var(--blue)]',
    green:
      'bg-[var(--green)] border-[var(--green)] text-black hover:bg-green-400 focus-visible:ring-[var(--green)]',
    purple:
      'bg-[var(--purple)] border-[var(--purple)] text-white hover:bg-purple-500 focus-visible:ring-[var(--purple)]',
    orange:
      'bg-[var(--orange)] border-[var(--orange)] text-white hover:bg-orange-400 focus-visible:ring-[var(--orange)]',
    edit: 'bg-[var(--orange)] border-[var(--orange)] text-white hover:bg-orange-400 focus-visible:ring-[var(--orange)]',
    danger:
      'bg-[var(--red)] border-[var(--red)] text-white hover:bg-red-400 focus-visible:ring-[var(--red)]',
    ghost:
      'bg-transparent border-[var(--border)] text-[var(--muted)] hover:bg-[var(--panel2)] hover:text-[var(--text)] focus-visible:ring-[var(--border)]',
    outline:
      'bg-transparent border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel2)] focus-visible:ring-[var(--border)]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
