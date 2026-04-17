/**
 * Calcule l'âge en années à partir d'une date de naissance `YYYY-MM-DD`.
 * Retourne une chaîne vide si la date est absente, invalide ou dans le futur.
 */
export function calculateAgeFromBirthDate(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '';
  const parts = isoDate.trim().split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return '';
  const [y, m, d] = parts;
  if (y < 1900 || y > 2100) return '';
  const birth = new Date(y, m - 1, d);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const b0 = new Date(birth);
  b0.setHours(0, 0, 0, 0);
  if (b0 > today) return '';
  let age = today.getFullYear() - b0.getFullYear();
  const monthDiff = today.getMonth() - b0.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < b0.getDate())) {
    age -= 1;
  }
  return String(Math.max(0, Math.min(130, age)));
}
