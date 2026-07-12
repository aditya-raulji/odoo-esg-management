'use client';

import { createContext, useContext, useCallback, useState, useRef } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let _toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const toast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = ++_toastId;
      setToasts((prev) => [
        ...prev,
        { id, type, title, message },
      ]);
      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  // Convenience methods
  toast.success = (title, message) => toast({ type: 'success', title, message });
  toast.error = (title, message) => toast({ type: 'error', title, message });
  toast.warning = (title, message) => toast({ type: 'warning', title, message });
  toast.info = (title, message) => toast({ type: 'info', title, message });

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast: t, onDismiss }) {
  const iconMap = {
    success: <CheckCircle2 size={18} className="text-[var(--green)] shrink-0" />,
    error: <XCircle size={18} className="text-[var(--red)] shrink-0" />,
    warning: <AlertCircle size={18} className="text-[var(--amber)] shrink-0" />,
    info: <Info size={18} className="text-[var(--blue)] shrink-0" />,
  };

  const borderMap = {
    success: 'border-l-[var(--green)]',
    error: 'border-l-[var(--red)]',
    warning: 'border-l-[var(--amber)]',
    info: 'border-l-[var(--blue)]',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-[var(--panel)] border border-[var(--border)] border-l-4 ${
        borderMap[t.type]
      } rounded-xl shadow-2xl animate-in slide-in-from-right-full duration-200`}
      role="alert"
    >
      {iconMap[t.type]}
      <div className="flex-1 min-w-0">
        {t.title && (
          <p className="text-sm font-semibold text-[var(--text)] leading-tight">
            {t.title}
          </p>
        )}
        {t.message && (
          <p className="text-xs text-[var(--muted)] mt-0.5">{t.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        className="p-0.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
