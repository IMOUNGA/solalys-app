/** Couleurs de la marque (logo provisoire) : bleu roi et or soleil. */
export const BRAND = {
  blue: '#2345C2',
  blueLight: '#2E52D6',
  blueLighter: '#3A5FE0',
  blueSoft: '#F4F6FC',
  blueText: '#1E3A9E',
  blueMuted: '#C9D5FF',
  gold: '#F2B632',
} as const;

/** Initiales d'un nom de groupe : « Club Démo Présence » → « CD ». Mots courts ignorés. */
export function initialsOf(name: string): string {
  const words = name
    .split(/[\s'’-]+/)
    .filter((w) => w.length > 2 || /^[A-Z0-9]/.test(w));
  const letters = (words.length ? words : [name]).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}
