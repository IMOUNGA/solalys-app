import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchEventsThunk } from '@/store/thunks/eventsThunks';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TrouverScreen() {
  const dispatch = useAppDispatch();
  const { events, status } = useAppSelector((state) => state.events);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchEventsThunk({}));
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchEventsThunk({}));
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
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {item.name}
          </Text>
          <View className="flex-row items-center gap-1">
            <IconSymbol name="calendar" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(item.hours)}
            </Text>
          </View>
        </View>
        {item.group && (
          <View className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
            <Text className="text-xs font-medium text-blue-700 dark:text-blue-300">
              {item.group.name}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center gap-1 mb-2">
        <IconSymbol name="location.fill" size={14} color="#6B7280" />
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {item.city}, {item.country}
        </Text>
      </View>

      {item.participants && item.participants.length > 0 && (
        <View className="flex-row items-center gap-1 mt-2">
          <IconSymbol name="person.2.fill" size={14} color="#10B981" />
          <Text className="text-xs text-gray-500 dark:text-gray-500">
            {item.participants.length} participant{item.participants.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </Pressable>
  );

  if (!user) {
    return (
      <ThemedView className="flex-1 items-center justify-center p-5">
        <IconSymbol name="calendar.badge.exclamationmark" size={64} color="#9CA3AF" />
        <ThemedText type="subtitle" className="mt-4 text-center">
          Connectez-vous pour découvrir les événements
        </ThemedText>
        <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
          Participez à des événements locaux et rencontrez du monde
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

  if (status === 'loading' && events.length === 0) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-gray-500 mt-4">Chargement des événements...</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <View className="p-5 pb-3 border-b border-gray-200 dark:border-gray-800">
        <ThemedText type="title" className="mb-2">
          Événements
        </ThemedText>
        <Text className="text-gray-600 dark:text-gray-400">
          Découvrez les événements près de chez vous
        </Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <IconSymbol name="calendar.badge.exclamationmark" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center">
              Aucun événement disponible pour le moment
            </Text>
          </View>
        }
      />
    </ThemedView>
  );
}
