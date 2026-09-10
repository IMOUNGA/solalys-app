// L'app reste volontairement toujours en mode clair (décision produit du
// 2026-09-10) : on ignore le thème système plutôt que de suivre l'OS.
export function useColorScheme(): 'light' {
  return 'light';
}
