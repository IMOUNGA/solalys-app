import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchGroupsThunk } from '@/store/thunks/groupsThunks';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

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
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm active:opacity-80 border border-gray-100 dark:border-gray-700"
      onPress={() => router.push(`/(tabs)/(groupes)/${item.id}`)}
    >
      <View className="mb-3">
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {item.name}
        </Text>
        {item.slogan && (
          <Text className="text-sm text-gray-600 dark:text-gray-400 italic">
            "{item.slogan}"
          </Text>
        )}
      </View>

      <View className="space-y-2">
        <View className="flex-row items-center gap-2">
          <View className="bg-red-100 dark:bg-red-900 rounded-full p-1.5">
            <IconSymbol name="location.fill" size={14} color="#EF4444" />
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {item.city}, {item.country}
          </Text>
        </View>

        <View className="flex-row items-center gap-4">
          {item.groupMemberships && item.groupMemberships.length > 0 && (
            <View className="flex-row items-center gap-2">
              <View className="bg-purple-100 dark:bg-purple-900 rounded-full p-1.5">
                <IconSymbol name="person.2.fill" size={14} color="#8B5CF6" />
              </View>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {item.groupMemberships.length} membre{item.groupMemberships.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {item.events && item.events.length > 0 && (
            <View className="flex-row items-center gap-2">
              <View className="bg-blue-100 dark:bg-blue-900 rounded-full p-1.5">
                <IconSymbol name="calendar" size={14} color="#3B82F6" />
              </View>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {item.events.length} événement{item.events.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  if (!user) {
    return (
      <ThemedView className="flex-1">
        <LinearGradient
          colors={['#10B981', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <View className="flex-1 items-center justify-center px-6">
            <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 items-center" style={{ width: width - 48 }}>
              <View className="bg-white/20 rounded-full p-6 mb-6">
                <IconSymbol name="person.3.fill" size={80} color="#fff" />
              </View>
              <Text className="text-white text-3xl font-bold mb-3 text-center">
                Rejoignez des groupes
              </Text>
              <Text className="text-white/80 text-center text-base mb-8 leading-6">
                Connectez-vous pour découvrir et rejoindre des groupes qui partagent vos passions et centres d'intérêt
              </Text>
              <Pressable
                className="bg-white py-4 px-8 rounded-2xl w-full active:opacity-80"
                onPress={() => router.push('/(auth)')}
              >
                <Text className="text-green-600 text-center font-bold text-lg">
                  Se connecter
                </Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
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
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header with gradient */}
      <LinearGradient
        colors={['#10B981', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-white text-3xl font-bold mb-2">
              Groupes
            </Text>
            <Text className="text-white/80 text-base">
              {groups.length} groupe{groups.length > 1 ? 's' : ''} disponible{groups.length > 1 ? 's' : ''}
            </Text>
          </View>
          <View className="bg-white/20 rounded-full p-4">
            <IconSymbol name="person.3.fill" size={40} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      {groups.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 -mt-20">
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-8 items-center shadow-lg" style={{ width: width - 48 }}>
            <View className="bg-green-100 dark:bg-green-900 rounded-full p-6 mb-4">
              <IconSymbol name="person.3.fill" size={64} color="#10B981" />
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Aucun groupe disponible
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mb-6 leading-6">
              Il n'y a pas encore de groupes dans votre région. Revenez bientôt pour découvrir de nouvelles communautés !
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}
