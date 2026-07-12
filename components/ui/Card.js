'use client';

/**
 * Card component — base panel container
 */
export default function Card({ children, className = '', padding = true, ...props }) {
  return (
    <div
      className={`bg-[var(--panel)] border border-[var(--border)] rounded-xl ${
        padding ? 'p-5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold text-[var(--text)] ${className}`}>
      {children}
    </h3>
  );
}
