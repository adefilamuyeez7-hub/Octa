/**
 * Common Utility Functions
 */

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const debounce = (func, delay = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

export const throttle = (func, limit = 300) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const clsx = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const isEmpty = (value) => {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const getColorByStatus = (status) => {
  const colors = {
    'active': '#10b981',
    'inactive': '#6b7280',
    'pending': '#f59e0b',
    'completed': '#3b82f6',
    'archived': '#9ca3af',
    'paid': '#10b981',
    'unpaid': '#ef4444',
    'high': '#ef4444',
    'medium': '#f59e0b',
    'low': '#3b82f6'
  };
  return colors[status] || '#6b7280';
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
