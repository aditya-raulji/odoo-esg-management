'use client';

/**
 * ProgressBar component — green fill with label
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showPercent = true,
  color = 'green',
  height = 'h-2',
  className = '',
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const colorMap = {
    green: 'bg-[var(--green)]',
    blue: 'bg-[var(--blue)]',
    purple: 'bg-[var(--purple)]',
    orange: 'bg-[var(--orange)]',
    amber: 'bg-[var(--amber)]',
    red: 'bg-[var(--red)]',
  };

  const barColor = colorMap[color] || colorMap.green;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-[var(--muted)]">{label}</span>}
          {showPercent && (
            <span className="text-[var(--text)] font-medium">{Math.round(percent)}%</span>
          )}
        </div>
      )}
      <div className={`w-full ${height} bg-[var(--border)] rounded-full overflow-hidden`}>
        <div
          className={`${height} ${barColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
