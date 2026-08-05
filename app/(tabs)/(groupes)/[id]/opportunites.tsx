import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useAppSelector } from '@/hooks/useRedux';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { Opportunity, OPPORTUNITY_TYPES } from '@/types/opportunity';

type TabType = 'open' | 'closed';
type ScopeType = 'group' | 'all';

const typeInfo = (type: string) => OPPORTUNITY_TYPES.find((t) => t.value === type) ?? OPPORTUNITY_TYPES[4];

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

export default function OpportunitiesScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const { user } = useAppSelector((state) => state.auth);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [scope, setScope] = useState<ScopeType>('group');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const load = useCallback(async () => {
    try {
      const response = scope === 'all'
        ? await apiService.opportunities.getMine()
        : await apiService.opportunities.getForGroup(groupId);
      setOpportunities(response.data || []);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de charger le board d\'opportunités');
    }
  }, [groupId, scope]);

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

  const handleToggleInterest = async (opportunity: Opportunity) => {
    setBusyId(opportunity.id);
    try {
      const response = await apiService.opportunities.toggleInterest(opportunity.id);
      const interested = response.data.interested as boolean;
      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === opportunity.id
            ? { ...o, interestedByMe: interested, interestCount: o.interestCount + (interested ? 1 : -1) }
            : o
        )
      );
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const handleExpand = async (opportunity: Opportunity) => {
    if (expandedId === opportunity.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(opportunity.id);
    if (!opportunity.interests) {
      try {
        const response = await apiService.opportunities.getOne(opportunity.id);
        setOpportunities((prev) => prev.map((o) => (o.id === opportunity.id ? response.data : o)));
      } catch {
        // silencieux
      }
    }
  };

  const handleClose = async (opportunity: Opportunity) => {
    setBusyId(opportunity.id);
    try {
      await apiService.opportunities.close(opportunity.id);
      showSuccess('Opportunité clôturée');
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (opportunity: Opportunity) => {
    setBusyId(opportunity.id);
    try {
      await apiService.opportunities.remove(opportunity.id);
      setOpportunities((prev) => prev.filter((o) => o.id !== opportunity.id));
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = opportunities.filter((o) => (activeTab === 'open' ? o.status === 'open' : o.status === 'closed'));
  const openCount = opportunities.filter((o) => o.status === 'open').length;
  const closedCount = opportunities.filter((o) => o.status === 'closed').length;

  const renderItem = ({ item }: { item: Opportunity }) => {
    const info = typeInfo(item.type);
    const isAuthor = Number(user?.id) === item.userId;
    const isExpanded = expandedId === item.id;
    const isBusy = busyId === item.id;

    return (
      <View
        className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
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
          {scope === 'all' && item.group && (
            <View className="bg-violet-50 dark:bg-violet-950 rounded-full px-2.5 py-1 flex-1">
              <Text className="text-xs font-semibold text-violet-600 dark:text-violet-400" numberOfLines={1}>
                {item.group.name}
              </Text>
            </View>
          )}
        </View>

        <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">{item.title}</Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-3" numberOfLines={3}>
          {item.description}
        </Text>

        <View className="flex-row items-center gap-2 mb-3">
          <Avatar name={`${item.user.firstname} ${item.user.lastname}`} uri={item.user.avatar} size={28} />
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {item.user.firstname} {item.user.lastname}
              {item.user.metier ? ` · ${item.user.metier}` : ''}
            </Text>
          </View>
          <Text className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.createdat)}</Text>
        </View>

        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          {isAuthor ? (
            <Pressable onPress={() => handleExpand(item)} className="flex-row items-center gap-1.5 active:opacity-70">
              <IconSymbol name="person.2.fill" size={14} color="#8B5CF6" />
              <Text className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                {item.interestCount} intéressé{item.interestCount > 1 ? 's' : ''}
              </Text>
              <IconSymbol name={isExpanded ? 'chevron.up' as any : 'chevron.down' as any} size={12} color="#8B5CF6" />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => handleToggleInterest(item)}
              disabled={isBusy || item.status === 'closed'}
              className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
                item.interestedByMe ? 'bg-violet-500' : 'bg-gray-100 dark:bg-gray-800'
              } ${item.status === 'closed' ? 'opacity-50' : 'active:opacity-70'}`}
            >
              <IconSymbol
                name="hand.raised.fill"
                size={13}
                color={item.interestedByMe ? '#fff' : '#6B7280'}
              />
              <Text className={`text-xs font-semibold ${item.interestedByMe ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {item.interestedByMe ? 'Intéressé(e)' : `Intéressé ? (${item.interestCount})`}
              </Text>
            </Pressable>
          )}

          {isAuthor && item.status === 'open' && (
            <View className="flex-row gap-3">
              <Pressable onPress={() => handleClose(item)} disabled={isBusy} className="active:opacity-70">
                <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">Clôturer</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} disabled={isBusy} className="active:opacity-70">
                <Text className="text-xs font-semibold text-red-500">Supprimer</Text>
              </Pressable>
            </View>
          )}
        </View>

        {isAuthor && isExpanded && (
          <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            {item.interests && item.interests.length > 0 ? (
              <View className="gap-2">
                {item.interests.map((p) => (
                  <View key={p.id} className="flex-row items-center gap-2">
                    <Avatar name={`${p.firstname} ${p.lastname}`} uri={p.avatar} size={26} />
                    <Text className="text-xs text-gray-700 dark:text-gray-300">
                      {p.firstname} {p.lastname}
                      {p.metier ? ` · ${p.metier}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-xs text-gray-400 dark:text-gray-500">Personne pour l'instant</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">Board d'opportunités</Text>
        <Pressable
          onPress={() => router.push(`/(tabs)/(groupes)/${groupId}/opportunite-creer` as any)}
          className="w-9 h-9 items-center justify-center bg-violet-500 rounded-full active:opacity-80"
        >
          <IconSymbol name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      <View className="flex-row items-center gap-4 px-5 pt-3 bg-white dark:bg-gray-900">
        <Pressable onPress={() => setScope('group')} className="active:opacity-70">
          <Text className={`text-xs font-semibold ${scope === 'group' ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'}`}>
            Ce groupe
          </Text>
        </Pressable>
        <Pressable onPress={() => setScope('all')} className="active:opacity-70">
          <Text className={`text-xs font-semibold ${scope === 'all' ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'}`}>
            Tous mes groupes
          </Text>
        </Pressable>
      </View>

      <View className="flex-row gap-3 px-5 py-3 bg-white dark:bg-gray-900">
        <Pressable
          onPress={() => setActiveTab('open')}
          className={`flex-1 py-2.5 rounded-xl ${activeTab === 'open' ? 'bg-violet-500' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-center font-semibold text-sm ${activeTab === 'open' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            Ouvertes ({openCount})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('closed')}
          className={`flex-1 py-2.5 rounded-xl ${activeTab === 'closed' ? 'bg-violet-500' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-center font-semibold text-sm ${activeTab === 'closed' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            Clôturées ({closedCount})
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
                <IconSymbol name="lightbulb.fill" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
                {activeTab === 'open' ? 'Aucune opportunité ouverte' : 'Aucune opportunité clôturée'}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                {activeTab === 'open'
                  ? 'Postez un besoin (prestataire, partenariat, recrutement...) pour le groupe'
                  : 'Les opportunités clôturées apparaîtront ici'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
