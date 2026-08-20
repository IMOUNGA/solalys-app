import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { getAvailablePackages, purchasePackage, restorePurchases } from '@/services/purchasesService';

type Tier = 'gratuit' | 'pro' | 'organisateur';
type Period = 'monthly' | 'annual';

const TIER_LABEL: Record<Tier, string> = {
  gratuit: 'Gratuit',
  pro: 'Pro',
  organisateur: 'Organisateur',
};

const TIER_CONFIG: Record<'pro' | 'organisateur', {
  label: string;
  icon: 'star.fill' | 'person.3.fill';
  accent: string;
  accentBg: string;
  badge?: string;
  features: string[];
}> = {
  pro: {
    label: 'Pro',
    icon: 'star.fill',
    accent: '#8B5CF6',
    accentBg: '#EDE9FE',
    badge: 'Le plus populaire',
    features: [
      "Création d'événements & réunions",
      "Board d'opportunités complet",
      'Dashboard CA & recommandations complet',
      'Groupes illimités',
    ],
  },
  organisateur: {
    label: 'Organisateur',
    icon: 'person.3.fill',
    accent: '#D97706',
    accentBg: '#FEF3C7',
    features: [
      'Tout Pro, plus :',
      'Rôles & gouvernance de groupe',
      'Gestion des membres',
      'Espace invités sur 12 mois',
      'Événements payants',
    ],
  },
};

const formatDate = (iso?: string | null) => {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return null;
  }
};

const tierOfProduct = (productId: string): 'pro' | 'organisateur' | null => {
  if (productId.includes('organisateur')) return 'organisateur';
  if (productId.includes('pro')) return 'pro';
  return null;
};

const periodOfProduct = (pkg: PurchasesPackage): Period =>
  pkg.product.subscriptionPeriod === 'P1Y' ? 'annual' : 'monthly';

export default function AbonnementScreen() {
  const [currentTier, setCurrentTier] = useState<Tier>('gratuit');
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<string>('none');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [period, setPeriod] = useState<Period>('annual');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const load = useCallback(async () => {
    try {
      const subRes = await apiService.users.getSubscription();
      setCurrentTier((subRes.data?.subscriptionTier as Tier) ?? 'gratuit');
      setSubStatus(subRes.data?.subscriptionStatus ?? 'none');
      setPeriodEnd(subRes.data?.subscriptionCurrentPeriodEnd ?? null);
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible de charger l'abonnement");
    }
    try {
      const pkgs = await getAvailablePackages();
      setPackages(pkgs);
    } catch {
      setPackages([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasingId(pkg.identifier);
    try {
      await purchasePackage(pkg);
      showSuccess("Abonnement activé ! Ça peut prendre quelques secondes à se refléter partout dans l'app.");
      await load();
    } catch (error: any) {
      if (error?.userCancelled) return;
      showError(error?.message || "L'achat n'a pas pu être finalisé");
    } finally {
      setPurchasingId(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      showSuccess('Achats restaurés');
      await load();
    } catch (error: any) {
      showError(error?.message || 'Impossible de restaurer les achats');
    } finally {
      setRestoring(false);
    }
  };

  const byTierAndPeriod = useMemo(() => {
    const map: Record<'pro' | 'organisateur', Partial<Record<Period, PurchasesPackage>>> = {
      pro: {},
      organisateur: {},
    };
    for (const pkg of packages) {
      const tier = tierOfProduct(pkg.product.identifier);
      if (!tier) continue;
      map[tier][periodOfProduct(pkg)] = pkg;
    }
    return map;
  }, [packages]);

  const savingsPct = (tier: 'pro' | 'organisateur') => {
    const monthly = byTierAndPeriod[tier].monthly;
    const annual = byTierAndPeriod[tier].annual;
    if (!monthly || !annual) return null;
    const pct = Math.round((1 - annual.product.price / (monthly.product.price * 12)) * 100);
    return pct > 0 ? pct : null;
  };

  const topSavingsPct = Math.max(savingsPct('pro') ?? 0, savingsPct('organisateur') ?? 0) || null;

  const renewalLabel = useMemo(() => {
    const date = formatDate(periodEnd);
    if (!date) return null;
    if (subStatus === 'canceled') return `Actif jusqu'au ${date}`;
    if (subStatus === 'active' || subStatus === 'trialing') return `Renouvellement le ${date}`;
    return null;
  }, [periodEnd, subStatus]);

  const hasAnyPackage = packages.length > 0;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">Mon abonnement</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
        >
          {/* Palier actuel */}
          <View
            className="rounded-2xl p-4 mb-6 flex-row items-center gap-3 bg-white dark:bg-gray-900"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
          >
            <View className="bg-violet-100 dark:bg-violet-950 rounded-full p-2.5">
              <IconSymbol name={currentTier === 'gratuit' ? 'sparkles' : 'star.fill'} size={18} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 dark:text-gray-400">Palier actuel</Text>
              <Text className="text-base font-bold text-gray-900 dark:text-white">
                {TIER_LABEL[currentTier] ?? currentTier}
              </Text>
            </View>
            {renewalLabel && (
              <View className="flex-row items-center gap-1.5">
                <IconSymbol name="calendar" size={14} color="#9CA3AF" />
                <Text className="text-xs text-gray-500 dark:text-gray-400">{renewalLabel}</Text>
              </View>
            )}
          </View>

          {!hasAnyPackage ? (
            <View className="rounded-3xl overflow-hidden">
              <LinearGradient
                colors={['#F59E0B', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 28, alignItems: 'center' }}
              >
                <View className="rounded-full p-4 mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                  <IconSymbol name="gift.fill" size={30} color="#fff" />
                </View>
                <Text className="text-white text-lg font-bold text-center mb-2">
                  Gratuit jusqu'au 1ᵉʳ octobre
                </Text>
                <Text className="text-white text-center text-sm leading-5" style={{ opacity: 0.92 }}>
                  Profitez de toutes les fonctionnalités de Solalys sans restriction. Les abonnements Pro et
                  Organisateur ouvriront à la rentrée, le 1ᵉʳ octobre 2026.
                </Text>
              </LinearGradient>
            </View>
          ) : (
            <>
              {/* Bascule mensuel / annuel */}
              <View className="flex-row bg-gray-100 dark:bg-gray-900 rounded-2xl p-1 mb-5">
                {(['monthly', 'annual'] as Period[]).map((p) => {
                  const active = period === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPeriod(p)}
                      className={`flex-1 rounded-xl py-2.5 items-center flex-row justify-center gap-1.5 ${active ? 'bg-white dark:bg-gray-800' : ''}`}
                      style={active ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 } : undefined}
                    >
                      <Text className={`text-sm font-semibold ${active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {p === 'monthly' ? 'Mensuel' : 'Annuel'}
                      </Text>
                      {p === 'annual' && topSavingsPct && (
                        <View className="bg-emerald-100 dark:bg-emerald-950 rounded-full px-1.5 py-0.5">
                          <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            -{topSavingsPct}%
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {(['pro', 'organisateur'] as const).map((tier) => {
                const config = TIER_CONFIG[tier];
                const pkg = byTierAndPeriod[tier][period];
                const isCurrent = currentTier === tier;
                const isPurchasing = pkg ? purchasingId === pkg.identifier : false;
                const tierSavings = savingsPct(tier);

                return (
                  <View
                    key={tier}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-5 mb-4"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 10,
                      elevation: 2,
                      borderWidth: isCurrent ? 1.5 : 0,
                      borderColor: config.accent,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-2.5">
                        <View className="rounded-full p-2" style={{ backgroundColor: config.accentBg }}>
                          <IconSymbol name={config.icon} size={16} color={config.accent} />
                        </View>
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">{config.label}</Text>
                      </View>
                      {isCurrent ? (
                        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: config.accentBg }}>
                          <Text className="text-xs font-bold" style={{ color: config.accent }}>Palier actuel</Text>
                        </View>
                      ) : config.badge ? (
                        <View className="bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-1">
                          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">{config.badge}</Text>
                        </View>
                      ) : null}
                    </View>

                    {pkg && (
                      <View className="flex-row items-baseline gap-1 mb-1">
                        <Text className="text-3xl font-extrabold text-gray-900 dark:text-white">
                          {pkg.product.priceString}
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400">
                          /{period === 'annual' ? 'an' : 'mois'}
                        </Text>
                      </View>
                    )}
                    {period === 'annual' && tierSavings && (
                      <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
                        Économisez {tierSavings}% par rapport au mensuel
                      </Text>
                    )}

                    <View className="gap-2 mt-2 mb-5">
                      {config.features.map((feature, i) => (
                        <View key={i} className="flex-row items-start gap-2">
                          <IconSymbol name="checkmark.circle.fill" size={16} color={config.accent} />
                          <Text className="text-sm text-gray-700 dark:text-gray-300 flex-1">{feature}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      onPress={() => pkg && handlePurchase(pkg)}
                      disabled={!pkg || isCurrent || isPurchasing || !!purchasingId}
                      className={`rounded-2xl overflow-hidden ${isCurrent ? 'opacity-50' : isPurchasing ? 'opacity-70' : 'active:opacity-90'}`}
                    >
                      <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 14 }}>
                        <Text className="text-white text-center font-bold">
                          {isCurrent ? 'Palier actuel' : isPurchasing ? '...' : pkg ? `S'abonner — ${pkg.product.priceString}` : 'Indisponible'}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                );
              })}
            </>
          )}

          <Pressable onPress={handleRestore} disabled={restoring} className="mt-2 mb-6 items-center active:opacity-70">
            <Text className="text-sm font-semibold text-violet-600 dark:text-violet-400">
              {restoring ? 'Restauration...' : 'Restaurer mes achats'}
            </Text>
          </Pressable>

          {hasAnyPackage && (
            <View className="items-center gap-2">
              <Text className="text-[11px] text-gray-400 dark:text-gray-500 text-center leading-4 px-4">
                L'abonnement se renouvelle automatiquement sauf annulation au moins 24h avant la fin de la période en cours, dans les réglages de votre compte App Store / Google Play.
              </Text>
              <View className="flex-row gap-4">
                <Pressable onPress={() => router.push('/(tabs)/(compte)/legal')}>
                  <Text className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 underline">CGU et CGV</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/(tabs)/(compte)/privacy')}>
                  <Text className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 underline">Confidentialité</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
