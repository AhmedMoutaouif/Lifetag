export const sanitizeText = (value, maxLen = 5000) => {
  if (typeof value !== 'string') return '';
  const cleaned = value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, maxLen);
};

export const sanitizePhone = (value, maxLen = 20) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[^\d+\s()-]/g, '').slice(0, maxLen);
};

export const maskSensitive = (value, visible = 2) => {
  if (!value || typeof value !== 'string') return value || '';
  if (value.length <= visible) return '*'.repeat(value.length);
  return `${value.slice(0, visible)}${'*'.repeat(Math.max(3, value.length - visible))}`;
};
