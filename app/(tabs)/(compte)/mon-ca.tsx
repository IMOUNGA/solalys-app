import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { RevenueDashboard } from '@/types/referral';

const formatMoney = (amount: number) => `${amount.toLocaleString('fr-FR')} €`;

const formatDate = (dateString?: string | null) =>
  dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default function MonCaScreen() {
  const [dashboard, setDashboard] = useState<RevenueDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const showError = useErrorAlert();

  const load = useCallback(async () => {
    try {
      const response = await apiService.referrals.getDashboard();
      setDashboard(response.data);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de charger votre dashboard');
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

  const maxGroupTotal = dashboard?.byGroup[0]?.total || 1;
  const maxPersonTotal = dashboard?.byPerson[0]?.total || 1;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">Mon CA</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
        >
          <LinearGradient
            colors={['#10B981', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24, marginBottom: 24 }}
          >
            <Text className="text-white/80 text-sm font-medium mb-1">CA total généré via Solalys</Text>
            <Text className="text-white text-4xl font-bold">{formatMoney(dashboard?.total || 0)}</Text>
            <Text className="text-white/70 text-xs mt-3">
              Visible uniquement par vous — tous vos groupes confondus
            </Text>
          </LinearGradient>

          {!dashboard || dashboard.total === 0 ? (
            <View className="items-center justify-center py-10 px-8">
              <View className="bg-gray-100 dark:bg-gray-900 rounded-full p-6 mb-4">
                <IconSymbol name="chart.line.uptrend.xyaxis" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
                Pas encore de CA enregistré
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                Depuis un groupe, ouvrez "Recommandations & CA" pour ajouter votre premier CA ou marquer une recommandation convertie
              </Text>
            </View>
          ) : (
            <>
              <View className="mb-6">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Par groupe
                </Text>
                <View className="gap-3">
                  {dashboard.byGroup.map((g) => (
                    <View key={g.groupId}>
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">{g.groupName}</Text>
                        <Text className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(g.total)}</Text>
                      </View>
                      <View className="h-2 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                        <View
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${Math.max(6, (g.total / maxGroupTotal) * 100)}%` }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Par personne
                </Text>
                <View className="gap-3">
                  {dashboard.byPerson.map((p) => (
                    <View key={p.userId ?? 'direct'} className="flex-row items-center gap-3">
                      <Avatar name={p.userId ? `${p.firstname} ${p.lastname}` : 'CA'} size={36} />
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {p.userId ? `${p.firstname} ${p.lastname}` : p.firstname}
                        </Text>
                        <View className="h-1.5 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden mt-1">
                          <View
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${Math.max(6, (p.total / maxPersonTotal) * 100)}%` }}
                          />
                        </View>
                      </View>
                      <Text className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(p.total)}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Historique récent
                </Text>
                <View className="gap-2">
                  {dashboard.recent.map((entry) => (
                    <View
                      key={entry.id}
                      className="flex-row items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-3"
                    >
                      <View className="bg-green-100 dark:bg-green-950 rounded-full p-2">
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-800 dark:text-gray-200" numberOfLines={1}>
                          {entry.description}
                        </Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          {entry.group?.name} · {formatDate(entry.convertedat)}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatMoney(entry.amount || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
