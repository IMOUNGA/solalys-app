import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, SafeAreaView, RefreshControl, TextInput as RNTextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { Referral } from '@/types/referral';

type TabType = 'received' | 'given';

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  converted: 'Convertie',
  declined: 'Refusée',
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300' },
  accepted: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
  converted: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-300' },
  declined: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400' },
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ReferralsScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const { showAlert } = useAlert();
  const showError = useErrorAlert();
  const [given, setGiven] = useState<Referral[]>([]);
  const [received, setReceived] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await apiService.referrals.getForGroup(groupId);
      setGiven(response.data.given || []);
      setReceived(response.data.received || []);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de charger vos recommandations');
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

  const updateStatus = async (referralId: number, status: string, amount?: number) => {
    setBusyId(referralId);
    try {
      await apiService.referrals.updateStatus(referralId, { status, amount });
      setConvertingId(null);
      setAmountInput('');
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmConversion = (referralId: number) => {
    const amount = parseFloat(amountInput.replace(',', '.'));
    if (!amount || amount <= 0) {
      showError('Merci de saisir un montant valide');
      return;
    }
    updateStatus(referralId, 'converted', amount);
  };

  const handleCreate = () => {
    showAlert({
      title: 'Que voulez-vous faire ?',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ajouter du CA',
          style: 'default',
          onPress: () => router.push(`/(tabs)/(groupes)/${groupId}/revenue-creer` as any),
        },
        {
          text: 'Faire une recommandation',
          style: 'default',
          onPress: () => router.push(`/(tabs)/(groupes)/${groupId}/referral-creer` as any),
        },
      ],
    });
  };

  const renderReceived = ({ item }: { item: Referral }) => {
    const colors = STATUS_COLOR[item.status];
    const isBusy = busyId === item.id;
    const isConverting = convertingId === item.id;
    const canAct = item.status === 'pending' || item.status === 'accepted';

    return (
      <View
        className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className={`rounded-full px-2.5 py-1 ${colors.bg}`}>
            <Text className={`text-xs font-semibold ${colors.text}`}>{STATUS_LABEL[item.status]}</Text>
          </View>
          <Text className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.createdat)}</Text>
        </View>

        <Text className="text-sm text-gray-800 dark:text-gray-200 mb-3">{item.description}</Text>

        <View className="flex-row items-center gap-2 mb-3">
          {item.fromUser ? (
            <>
              <Avatar name={`${item.fromUser.firstname} ${item.fromUser.lastname}`} uri={item.fromUser.avatar} size={26} />
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Recommandé(e) par {item.fromUser.firstname} {item.fromUser.lastname}
              </Text>
            </>
          ) : (
            <Text className="text-xs text-gray-500 dark:text-gray-400 italic">CA renseigné directement</Text>
          )}
        </View>

        {item.amount != null && (
          <Text className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">
            {item.amount.toLocaleString('fr-FR')} €
          </Text>
        )}

        {canAct && !isConverting && (
          <View className="flex-row gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {item.status === 'pending' && (
              <Pressable
                onPress={() => updateStatus(item.id, 'accepted')}
                disabled={isBusy}
                className="flex-1 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 items-center active:opacity-70"
              >
                <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">Accepter</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setConvertingId(item.id)}
              disabled={isBusy}
              className="flex-1 py-2.5 rounded-xl bg-green-50 dark:bg-green-950 items-center active:opacity-70"
            >
              <Text className="text-xs font-semibold text-green-600 dark:text-green-400">Marquer convertie</Text>
            </Pressable>
            <Pressable
              onPress={() => updateStatus(item.id, 'declined')}
              disabled={isBusy}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 items-center active:opacity-70"
            >
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Refuser</Text>
            </Pressable>
          </View>
        )}

        {isConverting && (
          <View className="pt-2 border-t border-gray-100 dark:border-gray-800 gap-2">
            <View className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2">
              <RNTextInput
                className="text-base text-gray-900 dark:text-white"
                placeholder="Montant de l'affaire (€)"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                value={amountInput}
                onChangeText={setAmountInput}
                autoFocus
              />
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => { setConvertingId(null); setAmountInput(''); }}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 items-center active:opacity-70"
              >
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={() => handleConfirmConversion(item.id)}
                disabled={isBusy}
                className="flex-1 py-2.5 rounded-xl bg-green-500 items-center active:opacity-90"
              >
                <Text className="text-xs font-semibold text-white">{isBusy ? '...' : 'Confirmer'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderGiven = ({ item }: { item: Referral }) => {
    const colors = STATUS_COLOR[item.status];
    return (
      <View
        className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className={`rounded-full px-2.5 py-1 ${colors.bg}`}>
            <Text className={`text-xs font-semibold ${colors.text}`}>{STATUS_LABEL[item.status]}</Text>
          </View>
          <Text className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.createdat)}</Text>
        </View>
        <Text className="text-sm text-gray-800 dark:text-gray-200 mb-3">{item.description}</Text>
        <View className="flex-row items-center gap-2">
          <Avatar name={`${item.toUser.firstname} ${item.toUser.lastname}`} uri={item.toUser.avatar} size={26} />
          <Text className="text-xs text-gray-600 dark:text-gray-400">
            Pour {item.toUser.firstname} {item.toUser.lastname}
          </Text>
        </View>
        {item.amount != null && (
          <Text className="text-base font-bold text-green-600 dark:text-green-400 mt-2">
            {item.amount.toLocaleString('fr-FR')} € générés
          </Text>
        )}
      </View>
    );
  };

  const data = activeTab === 'received' ? received : given;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">Recommandations & CA</Text>
        <Pressable
          onPress={handleCreate}
          className="w-9 h-9 items-center justify-center bg-green-500 rounded-full active:opacity-80"
        >
          <IconSymbol name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      <View className="flex-row gap-3 px-5 py-3 bg-white dark:bg-gray-900">
        <Pressable
          onPress={() => setActiveTab('received')}
          className={`flex-1 py-2.5 rounded-xl ${activeTab === 'received' ? 'bg-green-500' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-center font-semibold text-sm ${activeTab === 'received' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            Reçues ({received.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('given')}
          className={`flex-1 py-2.5 rounded-xl ${activeTab === 'given' ? 'bg-green-500' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-center font-semibold text-sm ${activeTab === 'given' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            Données ({given.length})
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={activeTab === 'received' ? renderReceived : renderGiven}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
                <IconSymbol name="chart.line.uptrend.xyaxis" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
                {activeTab === 'received' ? 'Aucune recommandation reçue' : 'Aucune recommandation donnée'}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                {activeTab === 'received'
                  ? 'Les recommandations reçues et votre CA apparaîtront ici'
                  : 'Recommandez un membre pour booster son activité'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
