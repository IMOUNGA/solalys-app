import * as WebBrowser from 'expo-web-browser';

const SITE = 'https://solalys.com';

/**
 * Pages légales et d'aide : une seule source de vérité, le site solalys.com,
 * ouvert dans le navigateur intégré (toujours à jour, sans nouveau build).
 */
export const LEGAL_LINKS = {
  cgu: `${SITE}/mentions-legales`,
  privacy: `${SITE}/confidentialite`,
  support: `${SITE}/support`,
} as const;

export function openSitePage(page: keyof typeof LEGAL_LINKS) {
  return WebBrowser.openBrowserAsync(LEGAL_LINKS[page]);
}
