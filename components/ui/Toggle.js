'use client';

/**
 * Toggle (switch) component
 */
export default function Toggle({ label, id, checked, onChange, disabled = false }) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors duration-200 ${
            checked ? 'bg-[var(--green)]' : 'bg-[var(--border)]'
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
      {label && (
        <span className="text-sm text-[var(--text)]">{label}</span>
      )}
    </label>
  );
}
