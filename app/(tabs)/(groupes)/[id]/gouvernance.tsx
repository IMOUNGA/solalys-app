import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, SafeAreaView, RefreshControl, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useAppSelector } from '@/hooks/useRedux';
import { useErrorAlert, useConfirmAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { GroupRole, GroupRevenueSummary } from '@/types/groupRole';

const CURRENT_YEAR = new Date().getFullYear();

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const formatMoney = (amount: number) => `${amount.toLocaleString('fr-FR')} €`;

const csvEscape = (value: string) => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export default function GouvernanceScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const { user } = useAppSelector((state) => state.auth);
  const { currentGroup } = useAppSelector((state) => state.groups);
  const [roles, setRoles] = useState<GroupRole[]>([]);
  const [summary, setSummary] = useState<GroupRevenueSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const showError = useErrorAlert();
  const showConfirm = useConfirmAlert();

  const isCreator = user ? currentGroup?.groupcreator === Number(user.id) : false;
  const presidentRole = roles.find((r) => r.title.toLowerCase() === 'président');
  const isPresident = user ? presidentRole?.userId === Number(user.id) : false;
  const canManage = isCreator || isPresident;

  const load = useCallback(async (year: number | null) => {
    try {
      const [rolesRes, summaryRes] = await Promise.all([
        apiService.groupRoles.getForGroup(groupId),
        apiService.referrals.getGroupSummary(groupId, year ?? undefined).catch(() => ({ data: null })),
      ]);
      setRoles(rolesRes.data || []);
      setSummary(summaryRes.data);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de charger la gouvernance du groupe');
    }
  }, [groupId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load(selectedYear);
      setLoading(false);
    })();
  }, [selectedYear, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(selectedYear);
    setRefreshing(false);
  };

  const handleRemove = (role: GroupRole) => {
    showConfirm(
      `Retirer le rôle "${role.title}" de ${role.user.firstname} ${role.user.lastname} ?`,
      async () => {
        setRemovingId(role.id);
        try {
          await apiService.groupRoles.remove(groupId, role.id);
          setRoles((prev) => prev.filter((r) => r.id !== role.id));
        } catch (error: any) {
          showError(error?.response?.data?.message || 'Une erreur est survenue');
        } finally {
          setRemovingId(null);
        }
      },
      'Retirer ce rôle',
      'Retirer',
    );
  };

  const handleExportCsv = async () => {
    if (!summary) {
      showError('Aucune donnée à exporter');
      return;
    }

    setIsExporting(true);
    try {
      let rows: string[][];

      if (selectedYear) {
        rows = [
          ['Mois', 'CA (€)'],
          ...summary.byMonth.map((m) => [MONTH_LABELS[m.month - 1], String(m.total)]),
          ['Total', String(summary.total)],
        ];
      } else {
        rows = [
          ['Année', 'CA (€)'],
          ...summary.byYear.map((y) => [String(y.year), String(y.total)]),
          ['Total', String(summary.total)],
        ];
      }

      const csvContent = rows.map((row) => row.map((cell) => csvEscape(cell)).join(',')).join('\n');
      const fileName = `ca-groupe${selectedYear ? `-${selectedYear}` : ''}.csv`;
      const file = new File(Paths.cache, fileName);
      if (file.exists) {
        file.delete();
      }
      file.create();
      file.write(csvContent);

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        showError("Le partage n'est pas disponible sur cet appareil");
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exporter le CA du groupe',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (error: any) {
      showError("Impossible d'exporter le CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const yearOptions = Array.from(new Set([CURRENT_YEAR, ...(summary?.byYear.map((y) => y.year) || [])])).sort(
    (a, b) => b - a,
  );
  const maxYearTotal = summary?.byYear[0] ? Math.max(...summary.byYear.map((y) => y.total)) : 1;
  const maxMonthTotal = summary?.byMonth.length ? Math.max(1, ...summary.byMonth.map((m) => m.total)) : 1;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-2 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">Gouvernance</Text>

        <Pressable
          onPress={() => setYearPickerVisible(true)}
          className="flex-row items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 active:opacity-70"
        >
          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {selectedYear ?? 'Toutes années'}
          </Text>
          <IconSymbol name="chevron.down" size={12} color="#6B7280" />
        </Pressable>

        <Pressable
          onPress={handleExportCsv}
          disabled={isExporting || !summary}
          className={`flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 ${isExporting ? 'opacity-50' : 'active:opacity-70'}`}
        >
          <IconSymbol name="square.and.arrow.up" size={16} color="#3B82F6" />
          <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">CSV</Text>
        </Pressable>
      </View>

      <Modal
        visible={yearPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center px-10"
          onPress={() => setYearPickerVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl w-full overflow-hidden"
            style={{ maxWidth: 280 }}
          >
            <Text className="text-sm font-bold text-gray-900 dark:text-white px-5 pt-4 pb-2">
              Choisir une période
            </Text>
            {yearOptions.map((year) => (
              <Pressable
                key={year}
                onPress={() => { setSelectedYear(year); setYearPickerVisible(false); }}
                className={`flex-row items-center justify-between px-5 py-3 active:bg-gray-50 dark:active:bg-gray-800 ${selectedYear === year ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
              >
                <Text className={`text-base ${selectedYear === year ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {year}
                </Text>
                {selectedYear === year && <IconSymbol name="checkmark" size={18} color="#3B82F6" />}
              </Pressable>
            ))}
            <Pressable
              onPress={() => { setSelectedYear(null); setYearPickerVisible(false); }}
              className={`flex-row items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800 ${selectedYear === null ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
            >
              <Text className={`text-base ${selectedYear === null ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                Toutes années
              </Text>
              {selectedYear === null && <IconSymbol name="checkmark" size={18} color="#3B82F6" />}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        >
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24, marginBottom: 24 }}
          >
            <Text className="text-white/80 text-sm font-medium mb-1">
              CA généré par le groupe {selectedYear ? `en ${selectedYear}` : '(toutes années)'}
            </Text>
            <Text className="text-white text-4xl font-bold">{formatMoney(summary?.total || 0)}</Text>
            <Text className="text-white/70 text-xs mt-3">
              Total anonymisé, sans détail par membre
            </Text>
          </LinearGradient>

          {selectedYear && summary && summary.byMonth.length > 0 && (
            <View className="mb-6">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Par mois
              </Text>
              <View className="gap-2.5">
                {summary.byMonth.map((m) => (
                  <View key={m.month}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {MONTH_LABELS[m.month - 1]}
                      </Text>
                      <Text className="text-xs font-bold text-gray-900 dark:text-white">{formatMoney(m.total)}</Text>
                    </View>
                    <View className="h-1.5 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                      <View
                        className="h-1.5 bg-blue-500 rounded-full"
                        style={{ width: `${Math.max(m.total > 0 ? 4 : 0, (m.total / maxMonthTotal) * 100)}%` }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!selectedYear && summary && summary.byYear.length > 0 && (
            <View className="mb-6">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Par année
              </Text>
              <View className="gap-3">
                {summary.byYear.map((y) => (
                  <View key={y.year}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">{y.year}</Text>
                      <Text className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(y.total)}</Text>
                    </View>
                    <View className="h-2 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                      <View
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${Math.max(6, (y.total / maxYearTotal) * 100)}%` }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Rôles ({roles.length})
              </Text>
              {canManage && (
                <Pressable
                  onPress={() => router.push(`/(tabs)/(groupes)/${groupId}/role-creer` as any)}
                  className="w-7 h-7 items-center justify-center bg-blue-500 rounded-full active:opacity-80"
                >
                  <IconSymbol name="plus" size={14} color="#fff" />
                </Pressable>
              )}
            </View>
            {roles.length === 0 ? (
              <View className="items-center justify-center py-10 px-8 bg-white dark:bg-gray-900 rounded-2xl">
                <IconSymbol name="crown.fill" size={36} color="#9CA3AF" />
                <Text className="text-gray-500 dark:text-gray-400 text-center mt-3">
                  {canManage ? 'Attribuez un premier rôle avec le bouton +' : 'Aucun rôle attribué pour le moment'}
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {roles.map((role) => {
                  const isOwnPresidentRole = role.id === presidentRole?.id && isPresident;
                  return (
                    <View
                      key={role.id}
                      className="bg-white dark:bg-gray-900 rounded-2xl p-3"
                      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                    >
                      <View className="flex-row items-center gap-3">
                        <Avatar name={`${role.user.firstname} ${role.user.lastname}`} uri={role.user.avatar} size={40} />
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-gray-900 dark:text-white">{role.title}</Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {role.user.firstname} {role.user.lastname}
                          </Text>
                        </View>
                        {canManage && (
                          <Pressable
                            onPress={() => handleRemove(role)}
                            disabled={removingId === role.id}
                            className="p-2 active:opacity-60"
                          >
                            <IconSymbol name="xmark.circle.fill" size={20} color="#EF4444" />
                          </Pressable>
                        )}
                      </View>
                      {isOwnPresidentRole && (
                        <Pressable
                          onPress={() => router.push(`/(tabs)/(groupes)/${groupId}/ceder-presidence` as any)}
                          className="flex-row items-center justify-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 active:opacity-70"
                        >
                          <IconSymbol name="arrow.triangle.2.circlepath" size={14} color="#3B82F6" />
                          <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            Céder la présidence
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
