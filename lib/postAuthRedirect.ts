import { mmkv } from '@/lib/mmkv';

const KEY = 'post_auth_redirect';

/**
 * Écran à ouvrir après connexion ou inscription (ex. lien d'invitation
 * ouvert sans être connecté). Gardé sur l'appareil pour survivre à un
 * redémarrage de l'app pendant l'inscription.
 */
export function setPostAuthRedirect(path: string) {
  mmkv.set(KEY, path);
}

/** Lecture sans effacer : plusieurs écrans d'auth peuvent rediriger en même temps. */
export function getPostAuthRedirect(): string | null {
  const path = mmkv.getString(KEY);
  // Seuls des chemins internes à l'app sont acceptés.
  return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
}

export function clearPostAuthRedirect() {
  mmkv.delete(KEY);
}
