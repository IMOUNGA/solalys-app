import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchGroupMembersThunk } from '@/store/thunks/groupsThunks';
import { useSuccessAlert, useErrorAlert, useConfirmAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import type { GroupMember } from '@/types/group';

export default function TransferPresidentScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const dispatch = useAppDispatch();
  const { groupMembers } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();
  const showConfirm = useConfirmAlert();

  useEffect(() => {
    dispatch(fetchGroupMembersThunk(groupId));
  }, [groupId]);

  const otherMembers = (groupMembers as GroupMember[]).filter((m) => Number(user?.id) !== m.id);

  const handleTransfer = () => {
    if (!selectedId) {
      showError('Merci de choisir un membre');
      return;
    }
    const target = otherMembers.find((m) => m.id === selectedId);

    showConfirm(
      `${target?.firstname} ${target?.lastname} deviendra président(e) de ce groupe. Vous ne le serez plus. Continuer ?`,
      async () => {
        setIsSending(true);
        try {
          await apiService.groupRoles.transferPresident(groupId, selectedId);
          showSuccess('Présidence cédée !');
          router.back();
        } catch (error: any) {
          showError(error?.response?.data?.message || 'Impossible de céder la présidence');
        } finally {
          setIsSending(false);
        }
      },
      'Céder la présidence',
      'Confirmer',
    );
  };

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <View>
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingBottom: 20 }}
        >
          <SafeAreaView edges={['top']}>
            <View className="flex-row items-center px-5 pt-3 pb-4">
              <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2 mr-2">
                <IconSymbol name="chevron.left" size={22} color="#fff" />
              </Pressable>
              <Text className="text-white text-lg font-bold">Céder la présidence</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <View className="px-5 pt-5 pb-2">
        <Text className="text-base font-medium text-gray-700 dark:text-gray-300">
          À qui céder la présidence ?
        </Text>
      </View>

      <FlatList
        data={otherMembers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => {
          const isSelected = selectedId === item.id;
          return (
            <Pressable
              onPress={() => setSelectedId(item.id)}
              className={`flex-row items-center gap-3 p-3 rounded-xl mb-2 ${isSelected ? 'bg-blue-50 dark:bg-blue-950 border-2 border-blue-500' : 'bg-gray-50 dark:bg-gray-900 border-2 border-transparent'}`}
            >
              <Avatar name={`${item.firstname} ${item.lastname}`} uri={item.avatar} size={40} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.firstname} {item.lastname}
                </Text>
                {item.isCreator && (
                  <Text className="text-xs text-gray-500 dark:text-gray-400">Créateur du groupe</Text>
                )}
              </View>
              {isSelected && <IconSymbol name="checkmark.circle.fill" size={22} color="#3B82F6" />}
            </Pressable>
          );
        }}
      />

      <SafeAreaView edges={['bottom']}>
        <View className="p-5 pt-2">
          <Pressable
            onPress={handleTransfer}
            disabled={isSending}
            className={`rounded-2xl overflow-hidden ${isSending ? 'opacity-60' : 'active:opacity-90'}`}
          >
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16 }}
            >
              <Text className="text-white text-center font-bold text-base">
                {isSending ? 'Transfert...' : 'Céder la présidence'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
