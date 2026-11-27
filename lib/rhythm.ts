const WEEKDAYS_PLURAL = ['dimanches', 'lundis', 'mardis', 'mercredis', 'jeudis', 'vendredis', 'samedis'];

/** « Tous les mardis à 08h00 » (dayOfWeek : 0 = dimanche .. 6 = samedi), ou null si inconnu. */
export function weeklyRhythm(dayOfWeek?: number | null, startTime?: string | null): string | null {
  if (dayOfWeek === null || dayOfWeek === undefined || !WEEKDAYS_PLURAL[dayOfWeek] || !startTime) return null;
  return `Tous les ${WEEKDAYS_PLURAL[dayOfWeek]} à ${startTime.replace(':', 'h')}`;
}
