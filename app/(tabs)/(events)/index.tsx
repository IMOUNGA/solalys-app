import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchMyParticipationsThunk } from '@/store/thunks/eventsThunks';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function MyEventsScreen() {
  const dispatch = useAppDispatch();
  const { myParticipations, status } = useAppSelector((state) => state.events);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchMyParticipationsThunk());
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMyParticipationsThunk());
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEvent = ({ item }: any) => (
    <Pressable
      className="bg-white dark:bg-gray-800 p-4 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 active:opacity-70"
      onPress={() => router.push(`/(tabs)/(trouver)/${item.id}`)}
    >
      <View className="mb-2">
        <ThemedText type="defaultSemiBold" className="mb-1">
          {item.name}
        </ThemedText>
        {item.group && (
          <View className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full self-start mt-1">
            <Text className="text-xs font-medium text-blue-700 dark:text-blue-300">
              {item.group.name}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center gap-2 mb-2">
        <IconSymbol name="calendar" size={16} color="#6B7280" />
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(item.hours)}
        </Text>
      </View>

      <View className="flex-row items-center gap-2 mb-2">
        <IconSymbol name="location.fill" size={16} color="#6B7280" />
        <Text className="text-sm text-gray-600 dark:text-gray-400 flex-1">
          {item.city}, {item.country}
        </Text>
      </View>

      {item.participants && (
        <View className="flex-row items-center gap-2">
          <IconSymbol name="person.2.fill" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {item.participants.length} participant{item.participants.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </Pressable>
  );

  if (!user) {
    return (
      <ThemedView className="flex-1 items-center justify-center p-5">
        <IconSymbol name="person.crop.circle.badge.exclamationmark" size={64} color="#9CA3AF" />
        <ThemedText type="subtitle" className="mt-4 text-center">
          Connectez-vous pour voir vos événements
        </ThemedText>
        <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
          Participez à des événements et retrouvez-les ici
        </Text>
        <Pressable
          className="bg-blue-500 px-6 py-3 rounded-xl mt-6 active:opacity-80"
          onPress={() => router.push('/(auth)')}
        >
          <Text className="text-white font-semibold">Se connecter</Text>
        </Pressable>
      </ThemedView>
    );
  }

  if (status === 'loading' && myParticipations.length === 0) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-gray-500 mt-4">Chargement...</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <View className="p-5 pb-3 border-b border-gray-200 dark:border-gray-800">
        <ThemedText type="title">Mes événements</ThemedText>
        <Text className="text-gray-600 dark:text-gray-400 mt-1">
          {myParticipations.length} événement{myParticipations.length > 1 ? 's' : ''}
        </Text>
      </View>

      {myParticipations.length === 0 ? (
        <View className="flex-1 items-center justify-center p-5">
          <IconSymbol name="calendar.badge.exclamationmark" size={64} color="#9CA3AF" />
          <ThemedText type="subtitle" className="mt-4 text-center">
            Aucun événement
          </ThemedText>
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 mb-6">
            Participez à des événements pour les voir apparaître ici
          </Text>
          <Pressable
            className="bg-blue-500 px-6 py-3 rounded-xl active:opacity-80"
            onPress={() => router.push('/(tabs)/(trouver)')}
          >
            <Text className="text-white font-semibold">Découvrir des événements</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={myParticipations}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </ThemedView>
  );
}
