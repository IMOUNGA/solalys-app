import { useEffect, useState } from 'react';
import { apiService } from '@/services/apiService';

export type SubscriptionTier = 'gratuit' | 'pro' | 'organisateur';

/**
 * Vérifie le palier d'abonnement côté client, pour bloquer l'accès à un
 * écran/formulaire AVANT que l'utilisateur perde du temps à le remplir —
 * plutôt que de le laisser soumettre et découvrir le 403 après coup.
 */
export function useSubscriptionTier() {
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.users.getSubscription();
        setTier(res.data?.subscriptionTier ?? 'gratuit');
      } catch {
        setTier('gratuit');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return {
    tier,
    loading,
    hasPro: tier === 'pro' || tier === 'organisateur',
    hasOrganisateur: tier === 'organisateur',
  };
}
