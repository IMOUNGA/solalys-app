import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';

interface PendingInvitation {
  id: number;
  group: { id: number; name: string; city: string; country: string };
  invitedBy: { id: number; firstname: string; lastname: string };
  createdat: string;
}

export default function InvitationsScreen() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const load = useCallback(async () => {
    try {
      const response = await apiService.invitations.getMine();
      setInvitations(response.data || []);
    } catch (error) {
      // silencieux : l'écran affichera juste une liste vide
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

  const handleAccept = async (invitation: PendingInvitation) => {
    setProcessingId(invitation.id);
    try {
      await apiService.invitations.accept(invitation.id);
      showSuccess(`Vous avez rejoint ${invitation.group.name} !`);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible d'accepter cette invitation");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitation: PendingInvitation) => {
    setProcessingId(invitation.id);
    try {
      await apiService.invitations.decline(invitation.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible de refuser cette invitation");
    } finally {
      setProcessingId(null);
    }
  };

  const renderInvitation = ({ item }: { item: PendingInvitation }) => {
    const isProcessing = processingId === item.id;

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
        <View className="flex-row items-center gap-3 mb-3">
          <View className="bg-violet-100 dark:bg-violet-950 rounded-full p-2.5">
            <IconSymbol name="person.badge.plus" size={20} color="#8B5CF6" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 dark:text-white">
              {item.group.name}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Invité(e) par {item.invitedBy.firstname} {item.invitedBy.lastname}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => handleDecline(item)}
            disabled={isProcessing}
            className={`flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 items-center ${isProcessing ? 'opacity-50' : 'active:bg-gray-200'}`}
          >
            <Text className="text-gray-600 dark:text-gray-300 font-semibold">Refuser</Text>
          </Pressable>
          <Pressable
            onPress={() => handleAccept(item)}
            disabled={isProcessing}
            className={`flex-1 py-3 rounded-xl bg-violet-500 items-center ${isProcessing ? 'opacity-50' : 'active:bg-violet-600'}`}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Accepter</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">Invitations reçues</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <FlatList
          data={invitations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderInvitation}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
                <IconSymbol name="tray" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
                Aucune invitation
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                Les invitations reçues pour rejoindre un groupe apparaîtront ici
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
