import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/text-input';
import { useAppDispatch } from '@/hooks/useRedux';
import { logoutState } from '@/store/slices/authSlice';
import { clearTokens } from '@/lib/secureToken';
import { useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { DeletionImpact } from '@/types/deletionImpact';

export default function DeleteAccountScreen() {
  const dispatch = useAppDispatch();
  const [impact, setImpact] = useState<DeletionImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const showError = useErrorAlert();

  useEffect(() => {
    (async () => {
      try {
        const response = await apiService.users.getDeletionImpact();
        setImpact(response.data);
      } catch (error: any) {
        showError(error?.response?.data?.message || "Impossible de charger l'aperçu de suppression");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async () => {
    if (!password) {
      showError('Merci de saisir votre mot de passe pour confirmer');
      return;
    }

    setIsDeleting(true);
    try {
      await apiService.users.deleteAccount(password);
      await clearTokens();
      dispatch(logoutState());
      router.replace('/(tabs)/(trouver)');
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Impossible de supprimer le compte');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasImpact =
    impact && (impact.groupsToDelete.length > 0 || impact.creatorTransfers.length > 0 || impact.presidencyTransfers.length > 0);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">Supprimer mon compte</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
            <View className="items-center py-4">
              <View className="bg-red-50 dark:bg-red-950 rounded-full p-5 mb-4">
                <IconSymbol name="exclamationmark.triangle.fill" size={32} color="#EF4444" />
              </View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Cette action est irréversible
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center leading-5">
                Votre profil, vos adhésions et vos recommandations personnelles seront définitivement supprimés.
              </Text>
            </View>

            {impact?.groupsToDelete.map((g) => (
              <View key={g.groupId} className="flex-row items-start gap-2 bg-red-50 dark:bg-red-950 rounded-xl p-3">
                <IconSymbol name="trash.fill" size={16} color="#EF4444" />
                <Text className="flex-1 text-sm text-red-700 dark:text-red-300 leading-5">
                  Le groupe <Text className="font-bold">{g.groupName}</Text> sera supprimé définitivement (vous en êtes l'unique membre).
                </Text>
              </View>
            ))}

            {impact?.creatorTransfers.map((t) => (
              <View key={`creator-${t.groupId}`} className="flex-row items-start gap-2 bg-amber-50 dark:bg-amber-950 rounded-xl p-3">
                <IconSymbol name="arrow.triangle.2.circlepath" size={16} color="#D97706" />
                <Text className="flex-1 text-sm text-amber-700 dark:text-amber-300 leading-5">
                  La création du groupe <Text className="font-bold">{t.groupName}</Text> sera transmise à{' '}
                  <Text className="font-bold">{t.successorName}</Text>, membre le plus ancien du groupe.
                </Text>
              </View>
            ))}

            {impact?.presidencyTransfers.map((t) => (
              <View key={`president-${t.groupId}`} className="flex-row items-start gap-2 bg-amber-50 dark:bg-amber-950 rounded-xl p-3">
                <IconSymbol name="crown.fill" size={16} color="#D97706" />
                <Text className="flex-1 text-sm text-amber-700 dark:text-amber-300 leading-5">
                  La présidence du groupe <Text className="font-bold">{t.groupName}</Text> sera transmise à{' '}
                  <Text className="font-bold">{t.successorName}</Text>. Ils s'organiseront entre eux ensuite.
                </Text>
              </View>
            ))}

            {!hasImpact && (
              <View className="flex-row items-start gap-2 bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                <Text className="flex-1 text-sm text-gray-600 dark:text-gray-400 leading-5">
                  Aucun groupe ne sera affecté par la suppression de votre compte.
                </Text>
              </View>
            )}

            <View className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <TextInput
                label="Confirmez avec votre mot de passe"
                value={password}
                onChangeText={setPassword}
                placeholder="Mot de passe"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <Pressable
              onPress={handleDelete}
              disabled={isDeleting}
              className={`rounded-2xl py-4 bg-red-500 ${isDeleting ? 'opacity-60' : 'active:opacity-90'}`}
            >
              <Text className="text-white text-center font-bold text-base">
                {isDeleting ? 'Suppression...' : 'Supprimer définitivement mon compte'}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
