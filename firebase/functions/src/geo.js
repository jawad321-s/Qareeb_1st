/** Great-circle distance in km between two { latitude, longitude } points. */
export function distanceKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 0599123456 / +970599123456 / 00972599123456 → 599123456 (same as the app). */
export function normalizePhone(phone = '') {
  let d = String(phone).replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('970') || d.startsWith('972')) d = d.slice(3);
  return d.replace(/^0+/, '');
}
