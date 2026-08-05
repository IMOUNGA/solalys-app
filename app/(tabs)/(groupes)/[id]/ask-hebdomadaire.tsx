import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, SafeAreaView, RefreshControl, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useAppSelector } from '@/hooks/useRedux';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { WeeklyAsk } from '@/types/weeklyAsk';

const MAX_LENGTH = 500;

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export default function WeeklyAskScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const { user } = useAppSelector((state) => state.auth);
  const [asks, setAsks] = useState<WeeklyAsk[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const myAsk = asks.find((a) => a.userId === Number(user?.id));
  const othersAsks = asks.filter((a) => a.userId !== Number(user?.id));

  const load = useCallback(async () => {
    try {
      const response = await apiService.weeklyAsks.getForGroup(groupId);
      setAsks(response.data || []);
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible de charger les demandes de la semaine");
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

  const startEditing = () => {
    setContent(myAsk?.content ?? '');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setContent('');
  };

  const handlePublish = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await apiService.weeklyAsks.upsert(groupId, content.trim());
      showSuccess(myAsk ? 'Demande mise à jour' : 'Demande publiée pour la semaine');
      setEditing(false);
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!myAsk) return;
    setSaving(true);
    try {
      await apiService.weeklyAsks.remove(myAsk.id);
      setEditing(false);
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const renderMySlot = () => {
    // En édition (avec ou sans ask existant) : formulaire à la place de la carte.
    if (editing) {
      return (
        <View
          className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-5 border-2 border-violet-400"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
        >
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Ex : un contact chez un assureur pro, un client dans le BTP..."
            placeholderTextColor="#9CA3AF"
            multiline
            autoFocus
            maxLength={MAX_LENGTH}
            className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl p-3 min-h-20"
            style={{ textAlignVertical: 'top' }}
          />
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-xs text-gray-400 dark:text-gray-500">{content.length}/{MAX_LENGTH}</Text>
            <View className="flex-row items-center gap-4">
              {myAsk && (
                <Pressable onPress={handleDelete} disabled={saving} className="active:opacity-70">
                  <Text className="text-xs font-semibold text-red-500">Supprimer</Text>
                </Pressable>
              )}
              <Pressable onPress={cancelEditing} disabled={saving} className="active:opacity-70">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={handlePublish}
                disabled={saving || !content.trim()}
                className={`rounded-full px-4 py-2 ${
                  saving || !content.trim() ? 'bg-gray-200 dark:bg-gray-800' : 'bg-violet-500 active:opacity-80'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    saving || !content.trim() ? 'text-gray-400 dark:text-gray-600' : 'text-white'
                  }`}
                >
                  {saving ? '...' : myAsk ? 'Enregistrer' : 'Publier'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    // Mon ask déjà publié : épinglé en haut, tap pour éditer.
    if (myAsk) {
      return (
        <Pressable onPress={startEditing} className="active:opacity-80 mb-5">
          <View
            className="bg-violet-50 dark:bg-violet-950 rounded-2xl p-4 border border-violet-200 dark:border-violet-800"
          >
            <View className="flex-row items-center gap-1.5 mb-2">
              <IconSymbol name="pin.fill" size={12} color="#8B5CF6" />
              <Text className="text-xs font-bold text-violet-600 dark:text-violet-400">Votre demande cette semaine</Text>
              <View className="flex-1" />
              <IconSymbol name="pencil" size={14} color="#8B5CF6" />
            </View>
            <Text className="text-sm text-gray-900 dark:text-white">{myAsk.content}</Text>
          </View>
        </Pressable>
      );
    }

    // Pas encore publié : slot vide qui invite à publier.
    return (
      <Pressable onPress={startEditing} className="active:opacity-80 mb-5">
        <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 items-center">
          <IconSymbol name="plus.circle.fill" size={22} color="#8B5CF6" />
          <Text className="text-sm font-semibold text-violet-600 dark:text-violet-400 mt-2">
            Publier ce que vous recherchez cette semaine
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">Ma demande de la semaine</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">Votre demande personnelle, remise à jour chaque semaine</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <FlatList
            data={othersAsks}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
            ListHeaderComponent={renderMySlot()}
            renderItem={({ item }) => (
              <View
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Avatar name={`${item.user.firstname} ${item.user.lastname}`} uri={item.user.avatar} size={28} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {item.user.firstname} {item.user.lastname}
                      {item.user.metier ? ` · ${item.user.metier}` : ''}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.createdat)}</Text>
                </View>
                <Text className="text-sm text-gray-900 dark:text-white">{item.content}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-16 px-8">
                <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
                  <IconSymbol name="bubble.left.and.bubble.right.fill" size={36} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 dark:text-white font-semibold text-base mb-1 text-center">
                  Personne d'autre n'a encore publié cette semaine
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-center text-sm">
                  Soyez le premier à partager ce que vous recherchez
                </Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
