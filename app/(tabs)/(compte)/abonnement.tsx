import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { getAvailablePackages, purchasePackage, restorePurchases } from '@/services/purchasesService';

const TIER_LABEL: Record<string, string> = {
  gratuit: 'Gratuit',
  pro: 'Pro',
  organisateur: 'Organisateur',
};

export default function AbonnementScreen() {
  const [currentTier, setCurrentTier] = useState<string>('gratuit');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const load = useCallback(async () => {
    try {
      const [subRes, pkgs] = await Promise.all([
        apiService.users.getSubscription(),
        getAvailablePackages(),
      ]);
      setCurrentTier(subRes.data?.subscriptionTier ?? 'gratuit');
      setPackages(pkgs);
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible de charger l'abonnement");
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
      showSuccess('Abonnement activé ! Ça peut prendre quelques secondes à se refléter partout dans l\'app.');
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
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-5 flex-row items-center gap-3">
            <View className="bg-violet-100 dark:bg-violet-950 rounded-full p-2.5">
              <IconSymbol name="star.fill" size={18} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 dark:text-gray-400">Palier actuel</Text>
              <Text className="text-base font-bold text-gray-900 dark:text-white">
                {TIER_LABEL[currentTier] ?? currentTier}
              </Text>
            </View>
          </View>

          {packages.length === 0 ? (
            <View className="items-center justify-center py-16 px-8">
              <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
                <IconSymbol name="hourglass" size={36} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-base mb-1 text-center">
                Pas encore disponible
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center text-sm">
                Les abonnements Pro et Organisateur ouvrent le 1ᵉʳ octobre 2026.
              </Text>
            </View>
          ) : (
            packages.map((pkg) => {
              const isPurchasing = purchasingId === pkg.identifier;
              return (
                <View
                  key={pkg.identifier}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                >
                  <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">{pkg.product.title}</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">{pkg.product.description}</Text>
                  <Pressable
                    onPress={() => handlePurchase(pkg)}
                    disabled={isPurchasing || !!purchasingId}
                    className={`rounded-2xl overflow-hidden ${isPurchasing ? 'opacity-70' : 'active:opacity-90'}`}
                  >
                    <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 14 }}>
                      <Text className="text-white text-center font-bold">
                        {isPurchasing ? '...' : `S'abonner — ${pkg.product.priceString}`}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              );
            })
          )}

          <Pressable onPress={handleRestore} disabled={restoring} className="mt-4 items-center active:opacity-70">
            <Text className="text-sm font-semibold text-violet-600 dark:text-violet-400">
              {restoring ? 'Restauration...' : 'Restaurer mes achats'}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
