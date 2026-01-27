import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchGroupsThunk } from '@/store/thunks/groupsThunks';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function GroupesScreen() {
  const dispatch = useAppDispatch();
  const { groups, status } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchGroupsThunk({}));
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchGroupsThunk({}));
    setRefreshing(false);
  };

  const renderGroup = ({ item }: any) => (
    <Pressable
      className="bg-white dark:bg-gray-800 p-4 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 active:opacity-70"
      onPress={() => router.push(`/(tabs)/(groupes)/${item.id}`)}
    >
      <View className="mb-2">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {item.name}
        </Text>
        {item.slogan && (
          <Text className="text-sm text-gray-600 dark:text-gray-400 italic">
            "{item.slogan}"
          </Text>
        )}
      </View>

      <View className="flex-row items-center gap-1 mb-2">
        <IconSymbol name="location.fill" size={14} color="#6B7280" />
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {item.city}, {item.country}
        </Text>
      </View>

      <View className="flex-row items-center gap-4 mt-2">
        {item.groupMemberships && item.groupMemberships.length > 0 && (
          <View className="flex-row items-center gap-1">
            <IconSymbol name="person.2.fill" size={14} color="#10B981" />
            <Text className="text-xs text-gray-500">
              {item.groupMemberships.length} membre{item.groupMemberships.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
        {item.events && item.events.length > 0 && (
          <View className="flex-row items-center gap-1">
            <IconSymbol name="calendar" size={14} color="#3B82F6" />
            <Text className="text-xs text-gray-500">
              {item.events.length} événement{item.events.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  if (!user) {
    return (
      <ThemedView className="flex-1 items-center justify-center p-5">
        <IconSymbol name="person.3.fill" size={64} color="#9CA3AF" />
        <ThemedText type="subtitle" className="mt-4 text-center">
          Connectez-vous pour découvrir les groupes
        </ThemedText>
        <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
          Rejoignez des groupes qui vous intéressent
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

  if (status === 'loading' && groups.length === 0) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-gray-500 mt-4">Chargement des groupes...</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <View className="p-5 pb-3 border-b border-gray-200 dark:border-gray-800">
        <ThemedText type="title" className="mb-2">
          Groupes
        </ThemedText>
        <Text className="text-gray-600 dark:text-gray-400">
          Rejoignez des groupes qui vous intéressent
        </Text>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <IconSymbol name="person.3.fill" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center">
              Aucun groupe disponible pour le moment
            </Text>
          </View>
        }
      />
    </ThemedView>
  );
}
