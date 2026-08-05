import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, ActivityIndicator, SafeAreaView, RefreshControl, Modal } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { useConfirmAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { fetchMyGroupsThunk } from '@/store/thunks/groupsThunks';
import { RevenueDashboard } from '@/types/referral';
import { Opportunity, OPPORTUNITY_TYPES } from '@/types/opportunity';
import { Guest, GUEST_STATUSES, UPCOMING_GUEST_STATUSES } from '@/types/guest';

const CURRENT_YEAR = new Date().getFullYear();
type DashboardTab = 'ca' | 'opportunities' | 'guests';

const CREATE_ROUTE_BY_TAB: Record<DashboardTab, string> = {
  ca: 'revenue-creer',
  opportunities: 'opportunite-creer',
  guests: 'invite-creer',
};

const CREATE_LABEL_BY_TAB: Record<DashboardTab, string> = {
  ca: 'Ajouter du CA',
  opportunities: 'Publier une opportunité',
  guests: 'Proposer un invité',
};

const formatMoney = (amount: number) => `${amount.toLocaleString('fr-FR')} €`;

const formatDate = (dateString?: string | null) =>
  dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const csvEscape = (value: string) => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const opportunityTypeInfo = (type: string) => OPPORTUNITY_TYPES.find((t) => t.value === type) ?? OPPORTUNITY_TYPES[4];

const guestStatusInfo = (status: string) =>
  GUEST_STATUSES.find((s) => s.value === status) ?? UPCOMING_GUEST_STATUSES.find((s) => s.value === status) ?? UPCOMING_GUEST_STATUSES[0];

export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { myGroups } = useAppSelector((state) => state.groups);
  const [tab, setTab] = useState<DashboardTab>('ca');
  const [groupPickerVisible, setGroupPickerVisible] = useState(false);
  const showError = useErrorAlert();
  const showConfirm = useConfirmAlert();

  // Palier requis pour le CA et les opportunités — vérifié côté client
  // pour éviter d'envoyer l'utilisateur vers un formulaire qui échouera de
  // toute façon, plutôt que de le laisser essuyer un 403 après coup.
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [tierLoading, setTierLoading] = useState(true);
  const hasPro = subscriptionTier === 'pro' || subscriptionTier === 'organisateur';

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.users.getSubscription();
        setSubscriptionTier(res.data?.subscriptionTier ?? 'gratuit');
      } catch {
        setSubscriptionTier('gratuit');
      } finally {
        setTierLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (myGroups.length === 0) {
      dispatch(fetchMyGroupsThunk());
    }
  }, [dispatch, myGroups.length]);

  const navigateToCreate = (groupId: number) => {
    router.push(`/(tabs)/(groupes)/${groupId}/${CREATE_ROUTE_BY_TAB[tab]}` as any);
  };

  const handleCreatePress = () => {
    if (tierLoading) return;

    if ((tab === 'ca' || tab === 'opportunities') && !hasPro) {
      showConfirm(
        tab === 'ca'
          ? 'Le suivi du CA nécessite un abonnement Pro ou supérieur.'
          : "La publication d'opportunités nécessite un abonnement Pro ou supérieur.",
        () => router.push('/(tabs)/(compte)/abonnement' as any),
        'Abonnement requis',
        'Voir les offres',
      );
      return;
    }

    if (myGroups.length === 0) {
      showError('Rejoignez un groupe pour pouvoir ajouter du contenu');
      return;
    }
    if (myGroups.length === 1) {
      navigateToCreate(myGroups[0].id);
      return;
    }
    setGroupPickerVisible(true);
  };

  // --- CA ---
  const [caDashboard, setCaDashboard] = useState<RevenueDashboard | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(CURRENT_YEAR);
  const [caLoading, setCaLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [byPersonOpen, setByPersonOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);

  // --- Opportunités ---
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [oppLoading, setOppLoading] = useState(true);
  const [oppBusyId, setOppBusyId] = useState<number | null>(null);

  // --- Invités ---
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<DashboardTab>>(new Set());

  const loadCa = useCallback(async (year: number | null) => {
    try {
      const response = await apiService.referrals.getDashboard(year ?? undefined);
      setCaDashboard(response.data);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de charger votre CA');
    }
  }, []);

  const loadOpportunities = useCallback(async () => {
    try {
      const response = await apiService.opportunities.getMine();
      setOpportunities(response.data || []);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de charger vos opportunités');
    }
  }, []);

  const loadGuests = useCallback(async () => {
    try {
      const response = await apiService.guests.getAllMine();
      setGuests(response.data || []);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de charger vos invités');
    }
  }, []);

  useEffect(() => {
    if (tierLoading) return;

    if (!hasPro) {
      setCaLoading(false);
      setLoadedTabs((prev) => new Set(prev).add('ca'));
      return;
    }

    (async () => {
      setCaLoading(true);
      await loadCa(selectedYear);
      setCaLoading(false);
      setLoadedTabs((prev) => new Set(prev).add('ca'));
    })();
  }, [selectedYear, loadCa, tierLoading, hasPro]);

  useEffect(() => {
    if (loadedTabs.has(tab)) return;
    (async () => {
      if (tab === 'opportunities') {
        setOppLoading(true);
        await loadOpportunities();
        setOppLoading(false);
      } else if (tab === 'guests') {
        setGuestsLoading(true);
        await loadGuests();
        setGuestsLoading(false);
      }
      setLoadedTabs((prev) => new Set(prev).add(tab));
    })();
  }, [tab, loadedTabs, loadOpportunities, loadGuests]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (tab === 'ca' && hasPro) await loadCa(selectedYear);
    else if (tab === 'opportunities') await loadOpportunities();
    else if (tab === 'guests') await loadGuests();
    setRefreshing(false);
  };

  const handleExportCsv = async () => {
    if (!caDashboard || caDashboard.entries.length === 0) {
      showError('Aucune donnée à exporter pour cette période');
      return;
    }

    setIsExporting(true);
    try {
      const header = ['Date', 'Groupe', 'Description', 'Origine', 'Montant (€)'];
      const rows = caDashboard.entries.map((entry) => [
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
      if (file.exists) file.delete();
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
    } catch {
      showError("Impossible d'exporter le CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleInterest = async (opportunity: Opportunity) => {
    setOppBusyId(opportunity.id);
    try {
      const response = await apiService.opportunities.toggleInterest(opportunity.id);
      const interested = response.data.interested as boolean;
      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === opportunity.id
            ? { ...o, interestedByMe: interested, interestCount: o.interestCount + (interested ? 1 : -1) }
            : o,
        ),
      );
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setOppBusyId(null);
    }
  };

  const maxGroupTotal = caDashboard?.byGroup[0]?.total || 1;
  const maxPersonTotal = caDashboard?.byPerson[0]?.total || 1;
  const yearOptions = Array.from(new Set([CURRENT_YEAR, ...(caDashboard?.availableYears || [])])).sort((a, b) => b - a);

  const renderCaTab = () => {
    if (!hasPro) {
      return (
        <View className="flex-1 items-center justify-center px-8 py-16">
          <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
            <IconSymbol name="lock.fill" size={36} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
            Abonnement requis
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-5">
            Le suivi du CA (recommandations, dashboard personnel) nécessite un abonnement Pro ou supérieur.
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/(compte)/abonnement' as any)}
            className="bg-green-500 rounded-full px-5 py-3 active:opacity-80"
          >
            <Text className="text-white font-bold text-sm">Voir les offres</Text>
          </Pressable>
        </View>
      );
    }

    return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
    >
      <View className="flex-row items-center gap-2 mb-4">
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
          disabled={isExporting || !caDashboard || caDashboard.entries.length === 0}
          className={`flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 ${isExporting ? 'opacity-50' : 'active:opacity-70'}`}
        >
          <IconSymbol name="square.and.arrow.up" size={16} color="#10B981" />
          <Text className="text-xs font-semibold text-green-600 dark:text-green-400">CSV</Text>
        </Pressable>
      </View>

      <LinearGradient
        colors={['#10B981', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 24, marginBottom: 24 }}
      >
        <Text className="text-white/80 text-sm font-medium mb-1">
          CA généré via Solalys {selectedYear ? `en ${selectedYear}` : '(toutes années)'}
        </Text>
        <Text className="text-white text-4xl font-bold">{formatMoney(caDashboard?.total || 0)}</Text>
        <Text className="text-white/70 text-xs mt-3">
          Visible uniquement par vous — tous vos groupes confondus
        </Text>
      </LinearGradient>

      {!caDashboard || caDashboard.total === 0 ? (
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
              {caDashboard.byGroup.map((g) => (
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
            <Pressable
              onPress={() => setByPersonOpen((v) => !v)}
              className="flex-row items-center justify-between mb-3 active:opacity-70"
            >
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Par personne ({caDashboard.byPerson.length})
              </Text>
              <IconSymbol name={byPersonOpen ? 'chevron.up' : 'chevron.down'} size={14} color="#9CA3AF" />
            </Pressable>
            {byPersonOpen && (
              <View className="gap-3">
                {caDashboard.byPerson.map((p) => (
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
            )}
          </View>

          <View>
            <Pressable
              onPress={() => setHistoryOpen((v) => !v)}
              className="flex-row items-center justify-between mb-3 active:opacity-70"
            >
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Historique {selectedYear ? `(${caDashboard.entries.length})` : '(20 plus récents)'}
              </Text>
              <IconSymbol name={historyOpen ? 'chevron.up' : 'chevron.down'} size={14} color="#9CA3AF" />
            </Pressable>
            {historyOpen && (
              <View className="gap-2">
                {(selectedYear ? caDashboard.entries : caDashboard.entries.slice(0, 20)).map((entry) => (
                  <View key={entry.id} className="flex-row items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
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
            )}
          </View>
        </>
      )}
    </ScrollView>
    );
  };

  const renderOpportunitiesTab = () => (
    <FlatList
      data={opportunities}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
      renderItem={({ item }) => {
        const info = opportunityTypeInfo(item.type);
        const isAuthor = Number(user?.id) === item.userId;
        const isBusy = oppBusyId === item.id;

        return (
          <Pressable
            onPress={() => router.push(`/(tabs)/(groupes)/${item.groupId}/opportunites` as any)}
            className="active:opacity-90 mb-3"
          >
            <View
              className="bg-white dark:bg-gray-900 rounded-2xl p-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <View className="flex-row items-center gap-1.5 bg-amber-50 dark:bg-amber-950 rounded-full px-2.5 py-1">
                  <IconSymbol name={info.icon as any} size={12} color="#D97706" />
                  <Text className="text-xs font-semibold text-amber-700 dark:text-amber-300">{info.label}</Text>
                </View>
                {item.status === 'closed' && (
                  <View className="bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-1">
                    <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Clôturée</Text>
                  </View>
                )}
                {item.group && (
                  <View className="bg-violet-50 dark:bg-violet-950 rounded-full px-2.5 py-1 flex-1">
                    <Text className="text-xs font-semibold text-violet-600 dark:text-violet-400" numberOfLines={1}>
                      {item.group.name}
                    </Text>
                  </View>
                )}
              </View>

              <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">{item.title}</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400 mb-3" numberOfLines={2}>
                {item.description}
              </Text>

              <View className="flex-row items-center gap-2 mb-3">
                <Avatar name={`${item.user.firstname} ${item.user.lastname}`} uri={item.user.avatar} size={26} />
                <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-1">
                  {item.user.firstname} {item.user.lastname}
                </Text>
                <Text className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.createdat)}</Text>
              </View>

              {!isAuthor && (
                <Pressable
                  onPress={() => handleToggleInterest(item)}
                  disabled={isBusy || item.status === 'closed'}
                  className={`self-start flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
                    item.interestedByMe ? 'bg-violet-500' : 'bg-gray-100 dark:bg-gray-800'
                  } ${item.status === 'closed' ? 'opacity-50' : 'active:opacity-70'}`}
                >
                  <IconSymbol name="hand.raised.fill" size={13} color={item.interestedByMe ? '#fff' : '#6B7280'} />
                  <Text className={`text-xs font-semibold ${item.interestedByMe ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    {item.interestedByMe ? 'Intéressé(e)' : `Intéressé ? (${item.interestCount})`}
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View className="items-center justify-center py-16 px-8">
          <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
            <IconSymbol name="lightbulb.fill" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
            Aucune opportunité
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center">
            Les opportunités de tous vos groupes apparaîtront ici
          </Text>
        </View>
      }
    />
  );

  const renderGuestsTab = () => (
    <FlatList
      data={guests}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
      ListHeaderComponent={
        guests.length > 0 ? (
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {guests.length} invité{guests.length > 1 ? 's' : ''} proposé{guests.length > 1 ? 's' : ''} au total
          </Text>
        ) : null
      }
      renderItem={({ item }) => {
        const info = guestStatusInfo(item.status);
        return (
          <Pressable
            onPress={() => router.push(`/(tabs)/(groupes)/${item.groupId}/invites` as any)}
            className="active:opacity-90 mb-3"
          >
            <View
              className="bg-white dark:bg-gray-900 rounded-2xl p-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-base font-bold text-gray-900 dark:text-white flex-1">
                  {item.firstname} {item.lastname}
                </Text>
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${info.color}22` }}>
                  <Text className="text-xs font-semibold" style={{ color: info.color }}>{info.label}</Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {item.metier ? `${item.metier} · ` : ''}{item.group?.name}
              </Text>
              {item.feedback && (
                <Text className="text-sm text-violet-600 dark:text-violet-400 italic mt-1.5" numberOfLines={2}>
                  "{item.feedback}"
                </Text>
              )}
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View className="items-center justify-center py-16 px-8">
          <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
            <IconSymbol name="person.crop.circle.badge.plus" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
            Aucun invité proposé
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center">
            Les invités que vous proposez, dans tous vos groupes, apparaîtront ici
          </Text>
        </View>
      }
    />
  );

  const isLoading = tab === 'ca' ? caLoading : tab === 'opportunities' ? oppLoading : guestsLoading;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">Dashboard</Text>
        <Pressable
          onPress={handleCreatePress}
          className="w-9 h-9 items-center justify-center bg-violet-500 rounded-full active:opacity-80"
        >
          <IconSymbol name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      <View className="flex-row gap-2 px-5 py-3 bg-white dark:bg-gray-900">
        <Pressable
          onPress={() => setTab('ca')}
          className={`flex-1 py-2.5 rounded-xl ${tab === 'ca' ? 'bg-green-500' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-center font-semibold text-xs ${tab === 'ca' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            Mon CA {CURRENT_YEAR}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('opportunities')}
          className={`flex-1 py-2.5 rounded-xl ${tab === 'opportunities' ? 'bg-violet-500' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-center font-semibold text-xs ${tab === 'opportunities' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            Opportunités
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('guests')}
          className={`flex-1 py-2.5 rounded-xl ${tab === 'guests' ? 'bg-violet-500' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-center font-semibold text-xs ${tab === 'guests' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            Invités
          </Text>
        </Pressable>
      </View>

      <Modal visible={yearPickerVisible} transparent animationType="fade" onRequestClose={() => setYearPickerVisible(false)}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center px-10" onPress={() => setYearPickerVisible(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl w-full overflow-hidden"
            style={{ maxWidth: 280 }}
          >
            <Text className="text-sm font-bold text-gray-900 dark:text-white px-5 pt-4 pb-2">Choisir une période</Text>
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

      <Modal visible={groupPickerVisible} transparent animationType="fade" onRequestClose={() => setGroupPickerVisible(false)}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center px-10" onPress={() => setGroupPickerVisible(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl w-full overflow-hidden"
            style={{ maxWidth: 320 }}
          >
            <Text className="text-sm font-bold text-gray-900 dark:text-white px-5 pt-4 pb-2">
              {CREATE_LABEL_BY_TAB[tab]} — dans quel groupe ?
            </Text>
            {myGroups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => { setGroupPickerVisible(false); navigateToCreate(group.id); }}
                className="flex-row items-center justify-between px-5 py-3 active:bg-gray-50 dark:active:bg-gray-800"
              >
                <Text className="text-base text-gray-800 dark:text-gray-200">{group.name}</Text>
                <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : tab === 'ca' ? (
        renderCaTab()
      ) : tab === 'opportunities' ? (
        renderOpportunitiesTab()
      ) : (
        renderGuestsTab()
      )}
    </SafeAreaView>
  );
}
