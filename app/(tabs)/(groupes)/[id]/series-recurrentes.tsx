import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSmartBack } from '@/hooks/useSmartBack';
import { useSuccessAlert, useErrorAlert, useConfirmAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

interface RecurringSeries {
  id: number;
  name: string;
  city: string;
  dayOfWeek: number;
  startTime: string;
  active: boolean;
}

export default function RecurringSeriesScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const goBack = useSmartBack();
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();
  const showConfirm = useConfirmAlert();

  const [series, setSeries] = useState<RecurringSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiService.recurringEvents.getForGroup(groupId);
      setSeries(res.data || []);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de charger les séries récurrentes');
    }
  }, [groupId]);

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

  const handleToggleActive = async (item: RecurringSeries) => {
    setBusyId(item.id);
    try {
      await apiService.recurringEvents.update(item.id, { active: !item.active });
      showSuccess(item.active ? 'Série mise en pause' : 'Série reprise');
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (item: RecurringSeries) => {
    showConfirm(
      `Les occurrences déjà créées de "${item.name}" restent, mais plus aucune nouvelle ne sera générée.`,
      async () => {
        setBusyId(item.id);
        try {
          await apiService.recurringEvents.remove(item.id);
          showSuccess('Série supprimée');
          await load();
        } catch (error: any) {
          showError(error?.response?.data?.message || 'Une erreur est survenue');
        } finally {
          setBusyId(null);
        }
      },
      'Supprimer cette série ?',
      'Supprimer',
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={goBack} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">Réunions récurrentes</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <FlatList
          data={series}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
          renderItem={({ item }) => {
            const isBusy = busyId === item.id;
            return (
              <View
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-bold text-gray-900 dark:text-white flex-1">{item.name}</Text>
                  <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: item.active ? '#10B98122' : '#9CA3AF22' }}>
                    <Text className="text-xs font-semibold" style={{ color: item.active ? '#10B981' : '#6B7280' }}>
                      {item.active ? 'Active' : 'En pause'}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Chaque {DAY_LABELS[item.dayOfWeek]} à {item.startTime} · {item.city}
                </Text>
                <View className="flex-row items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Pressable onPress={() => handleDelete(item)} disabled={isBusy} className="active:opacity-70">
                    <Text className="text-xs font-semibold text-red-500">Supprimer</Text>
                  </Pressable>
                  <View className="flex-1" />
                  <Pressable
                    onPress={() => handleToggleActive(item)}
                    disabled={isBusy}
                    className={`rounded-full px-4 py-2 ${item.active ? 'bg-gray-100 dark:bg-gray-800' : 'bg-violet-500'}`}
                  >
                    <Text className={`text-xs font-bold ${item.active ? 'text-gray-600 dark:text-gray-300' : 'text-white'}`}>
                      {isBusy ? '...' : item.active ? 'Mettre en pause' : 'Reprendre'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
                <IconSymbol name="arrow.triangle.2.circlepath" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
                Aucune réunion récurrente
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                Active "Événement récurrent" en créant un événement pour ce groupe afin d'en créer une
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
