import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, TextInput as RNTextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import type { NetworkContact } from '@/types/referral';

export default function CreateReferralScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const [network, setNetwork] = useState<NetworkContact[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  useEffect(() => {
    apiService.users.getMyNetwork()
      .then((res: any) => setNetwork(res.data || []))
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!selectedId) {
      showError('Merci de choisir un membre à recommander');
      return;
    }
    if (!description.trim()) {
      showError('Merci de décrire la recommandation');
      return;
    }

    setIsSending(true);
    try {
      await apiService.referrals.give(groupId, { toUserId: selectedId, description: description.trim() });
      showSuccess('Recommandation envoyée !');
      router.back();
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible d'envoyer la recommandation");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View>
          <LinearGradient
            colors={['#10B981', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingBottom: 20 }}
          >
            <SafeAreaView edges={['top']}>
              <View className="flex-row items-center px-5 pt-3 pb-4">
                <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2 mr-2">
                  <IconSymbol name="chevron.left" size={22} color="#fff" />
                </Pressable>
                <Text className="text-white text-lg font-bold">Faire une recommandation</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        <View className="px-5 pt-5 pb-2">
          <Text className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
            Recommander qui ?
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Toutes les personnes avec qui vous partagez un groupe
          </Text>
        </View>

        <FlatList
          data={network}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
          style={{ maxHeight: 220 }}
          renderItem={({ item }) => {
            const isSelected = selectedId === item.id;
            return (
              <Pressable
                onPress={() => setSelectedId(item.id)}
                className={`flex-row items-center gap-3 p-3 rounded-xl mb-2 ${isSelected ? 'bg-green-50 dark:bg-green-950 border-2 border-green-500' : 'bg-gray-50 dark:bg-gray-900 border-2 border-transparent'}`}
              >
                <Avatar name={`${item.firstname} ${item.lastname}`} uri={item.avatar} size={40} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.firstname} {item.lastname}
                  </Text>
                  {item.metier && (
                    <Text className="text-xs text-gray-500 dark:text-gray-400">{item.metier}</Text>
                  )}
                </View>
                {isSelected && <IconSymbol name="checkmark.circle.fill" size={22} color="#10B981" />}
              </Pressable>
            );
          }}
        />

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-base font-medium text-gray-700 dark:text-gray-300">Description</Text>
            <View className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3.5">
              <RNTextInput
                className="text-base text-gray-900 dark:text-white"
                placeholder="Ex: Marie cherche un comptable, je pense à toi"
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 90 }}
                maxLength={500}
              />
            </View>
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
                {isSending ? 'Envoi...' : 'Envoyer la recommandation'}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
