import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TextInput as RNTextInput, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchGroupMembersThunk } from '@/store/thunks/groupsThunks';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import type { GroupMember } from '@/types/group';

export default function CreateRevenueScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const dispatch = useAppDispatch();
  const { groupMembers } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  useEffect(() => {
    dispatch(fetchGroupMembersThunk(groupId));
  }, [groupId]);

  const otherMembers = (groupMembers as GroupMember[]).filter((m) => Number(user?.id) !== m.id);

  const handleCreate = async () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      showError('Merci de saisir un montant valide');
      return;
    }
    if (!description.trim()) {
      showError('Merci de décrire ce CA');
      return;
    }

    setIsSending(true);
    try {
      await apiService.referrals.logRevenue(groupId, {
        amount: parsedAmount,
        description: description.trim(),
        fromUserId: selectedId ?? undefined,
      });
      showSuccess('CA ajouté à votre dashboard !');
      router.back();
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible d'ajouter ce CA");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View>
          <LinearGradient
            colors={['#10B981', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingBottom: 20 }}
          >
            <View className="flex-row items-center px-5 pt-3 pb-4">
              <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2 mr-2">
                <IconSymbol name="chevron.left" size={22} color="#fff" />
              </Pressable>
              <Text className="text-white text-lg font-bold">Ajouter du CA</Text>
            </View>
          </LinearGradient>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-base font-medium text-gray-700 dark:text-gray-300">Montant (€)</Text>
            <View className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3.5">
              <RNTextInput
                className="text-base text-gray-900 dark:text-white"
                placeholder="1500"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-base font-medium text-gray-700 dark:text-gray-300">Description</Text>
            <View className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3.5">
              <RNTextInput
                className="text-base text-gray-900 dark:text-white"
                placeholder="Ex: Mission de conseil pour un client du groupe"
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ minHeight: 70 }}
                maxLength={500}
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-base font-medium text-gray-700 dark:text-gray-300">
              Créditer un membre (facultatif)
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
              Si cette affaire vient d'une mise en relation informelle avec un membre
            </Text>

            {selectedId && (
              <Pressable
                onPress={() => setSelectedId(null)}
                className="flex-row items-center gap-1.5 self-start bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5 mt-1"
              >
                <Text className="text-xs font-semibold text-gray-600 dark:text-gray-300">Retirer la sélection</Text>
                <IconSymbol name="xmark.circle.fill" size={14} color="#6B7280" />
              </Pressable>
            )}

            <FlatList
              data={otherMembers}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
              renderItem={({ item }) => {
                const isSelected = selectedId === item.id;
                return (
                  <Pressable
                    onPress={() => setSelectedId(isSelected ? null : item.id)}
                    className="items-center"
                    style={{ width: 72 }}
                  >
                    <View style={isSelected ? { borderWidth: 2, borderColor: '#10B981', borderRadius: 999 } : undefined}>
                      <Avatar name={`${item.firstname} ${item.lastname}`} uri={item.avatar} size={52} />
                    </View>
                    <Text numberOfLines={1} className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                      {item.firstname}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={isSending}
            className={`rounded-2xl overflow-hidden mt-2 ${isSending ? 'opacity-60' : 'active:opacity-90'}`}
          >
            <LinearGradient
              colors={['#10B981', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16 }}
            >
              <Text className="text-white text-center font-bold text-base">
                {isSending ? 'Ajout...' : 'Ajouter au dashboard'}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
