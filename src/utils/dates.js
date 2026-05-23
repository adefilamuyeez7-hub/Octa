/**
 * Date/Time Utilities
 */

export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long':
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    case 'time':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case 'datetime':
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    default:
      return d.toISOString();
  }
};

export const getDaysUntil = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const isOverdue = (date) => getDaysUntil(date) < 0;
export const isToday = (date) => {
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

export const isThisWeek = (date) => {
  const d = new Date(date);
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  return d >= weekStart && d <= weekEnd;
};

export const getMonthYear = (date = new Date()) => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const getPayrollPeriod = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};
