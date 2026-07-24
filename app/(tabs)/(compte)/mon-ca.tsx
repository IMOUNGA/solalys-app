import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, SafeAreaView, RefreshControl, Modal } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { RevenueDashboard } from '@/types/referral';

const CURRENT_YEAR = new Date().getFullYear();

const formatMoney = (amount: number) => `${amount.toLocaleString('fr-FR')} €`;

const formatDate = (dateString?: string | null) =>
  dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const csvEscape = (value: string) => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export default function MonCaScreen() {
  const [dashboard, setDashboard] = useState<RevenueDashboard | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const showError = useErrorAlert();

  const load = useCallback(async (year: number | null) => {
    try {
      const response = await apiService.referrals.getDashboard(year ?? undefined);
      setDashboard(response.data);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de charger votre dashboard');
    }
  }, []);

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

  const handleExportCsv = async () => {
    if (!dashboard || dashboard.entries.length === 0) {
      showError('Aucune donnée à exporter pour cette période');
      return;
    }

    setIsExporting(true);
    try {
      const header = ['Date', 'Groupe', 'Description', 'Origine', 'Montant (€)'];
      const rows = dashboard.entries.map((entry) => [
        formatDate(entry.convertedat),
        entry.group?.name || '',
        entry.description,
        entry.fromUser ? `${entry.fromUser.firstname} ${entry.fromUser.lastname}` : 'CA direct',
        String(entry.amount ?? 0),
      ]);

      const csvContent = [header, ...rows]
        .map((row) => row.map((cell) => csvEscape(String(cell))).join(','))
        .join('\n');

      const fileName = `mon-ca${selectedYear ? `-${selectedYear}` : ''}.csv`;
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
        dialogTitle: 'Exporter mon CA',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (error: any) {
      showError("Impossible d'exporter le CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const maxGroupTotal = dashboard?.byGroup[0]?.total || 1;
  const maxPersonTotal = dashboard?.byPerson[0]?.total || 1;
  const yearOptions = Array.from(new Set([CURRENT_YEAR, ...(dashboard?.availableYears || [])])).sort((a, b) => b - a);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">Mon CA</Text>

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
          disabled={isExporting || !dashboard || dashboard.entries.length === 0}
          className={`flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 ${isExporting ? 'opacity-50' : 'active:opacity-70'}`}
        >
          <IconSymbol name="square.and.arrow.up" size={16} color="#10B981" />
          <Text className="text-xs font-semibold text-green-600 dark:text-green-400">CSV</Text>
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
                className={`flex-row items-center justify-between px-5 py-3 active:bg-gray-50 dark:active:bg-gray-800 ${selectedYear === year ? 'bg-green-50 dark:bg-green-950' : ''}`}
              >
                <Text className={`text-base ${selectedYear === year ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {year}
                </Text>
                {selectedYear === year && <IconSymbol name="checkmark" size={18} color="#10B981" />}
              </Pressable>
            ))}
            <Pressable
              onPress={() => { setSelectedYear(null); setYearPickerVisible(false); }}
              className={`flex-row items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800 ${selectedYear === null ? 'bg-green-50 dark:bg-green-950' : ''}`}
            >
              <Text className={`text-base ${selectedYear === null ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                Toutes années
              </Text>
              {selectedYear === null && <IconSymbol name="checkmark" size={18} color="#10B981" />}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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
            <Text className="text-white/80 text-sm font-medium mb-1">
              CA généré via Solalys {selectedYear ? `en ${selectedYear}` : '(toutes années)'}
            </Text>
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
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Historique {selectedYear ? `(${dashboard.entries.length})` : '(20 plus récents)'}
                  </Text>
                </View>
                <View className="gap-2">
                  {(selectedYear ? dashboard.entries : dashboard.entries.slice(0, 20)).map((entry) => (
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
