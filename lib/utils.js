// lib/utils.js
// Shared utility functions

/**
 * Format a number with commas (e.g., 1234567 → "1,234,567")
 */
export function formatNumber(n, decimals = 0) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a date string or Date object
 */
export function formatDate(date, options = {}) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Truncate text to N characters
 */
export function truncate(str, n = 50) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

/**
 * Compute overall ESG score from component scores and weights
 */
export function computeESGScore({ envScore, socialScore, govScore, weightEnv = 40, weightSocial = 30, weightGov = 30 }) {
  return parseFloat(
    ((envScore * weightEnv + socialScore * weightSocial + govScore * weightGov) / 100).toFixed(1)
  );
}

/**
 * Get module accent color token
 */
export function getModuleAccent(module) {
  const map = {
    dashboard: '--blue',
    environmental: '--green',
    social: '--blue',
    governance: '--purple',
    gamification: '--orange',
    reports: '--muted',
    settings: '--muted',
  };
  return map[module?.toLowerCase()] || '--blue';
}

/**
 * Format CO2 amount
 */
export function formatCO2(kg) {
  if (kg == null) return '—';
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t CO₂`;
  return `${kg.toFixed(2)} kg CO₂`;
}

/**
 * Get initials from a name
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Class name joiner (like clsx without the dependency)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
