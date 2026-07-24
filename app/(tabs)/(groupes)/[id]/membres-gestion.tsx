import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useAppSelector } from '@/hooks/useRedux';
import { useErrorAlert, useConfirmAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import type { GroupMember } from '@/types/group';

interface PendingInvitation {
  id: number;
  email: string;
  status: string;
  createdat: string;
  invitedBy: { id: number; firstname: string; lastname: string };
}

export default function MembresGestionScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const { user } = useAppSelector((state) => state.auth);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const showError = useErrorAlert();
  const showConfirm = useConfirmAlert();

  const load = useCallback(async () => {
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        apiService.groups.getMembers(groupId),
        apiService.invitations.getForGroup(groupId),
      ]);
      setMembers(membersRes.data || []);
      setInvitations((invitationsRes.data || []).filter((i: PendingInvitation) => i.status === 'pending'));
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de charger la gestion des membres');
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

  const handleRemoveMember = (member: GroupMember) => {
    showConfirm(
      `Retirer ${member.firstname} ${member.lastname} du groupe ?`,
      async () => {
        setBusyId(member.id);
        try {
          await apiService.groups.removeMember(groupId, member.id);
          setMembers((prev) => prev.filter((m) => m.id !== member.id));
        } catch (error: any) {
          showError(error?.response?.data?.message || 'Une erreur est survenue');
        } finally {
          setBusyId(null);
        }
      },
      'Retirer ce membre',
      'Retirer',
    );
  };

  const handleCancelInvitation = (invitation: PendingInvitation) => {
    showConfirm(
      `Annuler l'invitation envoyée à ${invitation.email} ?`,
      async () => {
        setBusyId(invitation.id);
        try {
          await apiService.invitations.cancel(invitation.id);
          setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
        } catch (error: any) {
          showError(error?.response?.data?.message || 'Une erreur est survenue');
        } finally {
          setBusyId(null);
        }
      },
      "Annuler l'invitation",
      'Annuler',
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">Gestion des membres</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        >
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Membres ({members.length})
          </Text>
          <View className="gap-2 mb-6">
            {members.map((member) => {
              const isSelf = Number(user?.id) === member.id;
              return (
                <View
                  key={member.id}
                  className="flex-row items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-3"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                >
                  <Avatar name={`${member.firstname} ${member.lastname}`} uri={member.avatar} size={40} />
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900 dark:text-white">
                      {member.firstname} {member.lastname}
                    </Text>
                    {member.isCreator ? (
                      <Text className="text-xs text-gray-500 dark:text-gray-400">Créateur du groupe</Text>
                    ) : member.metier ? (
                      <Text className="text-xs text-gray-500 dark:text-gray-400">{member.metier}</Text>
                    ) : null}
                  </View>
                  {!member.isCreator && !isSelf && (
                    <Pressable
                      onPress={() => handleRemoveMember(member)}
                      disabled={busyId === member.id}
                      className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950 active:opacity-70"
                    >
                      <Text className="text-xs font-semibold text-red-600 dark:text-red-400">Retirer</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Invitations en attente ({invitations.length})
          </Text>
          {invitations.length === 0 ? (
            <View className="items-center justify-center py-8 px-8 bg-white dark:bg-gray-900 rounded-2xl">
              <IconSymbol name="envelope.fill" size={32} color="#9CA3AF" />
              <Text className="text-gray-500 dark:text-gray-400 text-center mt-3">
                Aucune invitation en attente
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {invitations.map((invitation) => (
                <View
                  key={invitation.id}
                  className="flex-row items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-3"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                >
                  <View className="bg-gray-100 dark:bg-gray-800 rounded-full p-2.5">
                    <IconSymbol name="envelope.fill" size={16} color="#6B7280" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 dark:text-white">{invitation.email}</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      Invité(e) par {invitation.invitedBy.firstname} {invitation.invitedBy.lastname}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleCancelInvitation(invitation)}
                    disabled={busyId === invitation.id}
                    className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 active:opacity-70"
                  >
                    <Text className="text-xs font-semibold text-gray-600 dark:text-gray-300">Annuler</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
