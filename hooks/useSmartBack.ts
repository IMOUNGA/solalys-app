import { router, useLocalSearchParams } from 'expo-router';

/**
 * Logique de retour centralisée — voir components/ui/BackButton.tsx pour
 * le contexte complet. Ce hook expose juste la fonction, pour les écrans
 * qui ont déjà leur propre style de bouton retour et veulent seulement
 * la logique returnTo (pas le variant "cercle blanc").
 */
export function useSmartBack() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  return () => {
    if (returnTo) {
      router.replace(returnTo as any);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)' as any);
  };
}
