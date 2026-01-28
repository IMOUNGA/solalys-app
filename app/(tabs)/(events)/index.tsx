import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchMyParticipationsThunk } from '@/store/thunks/eventsThunks';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

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
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm active:opacity-80 border border-gray-100 dark:border-gray-700"
      onPress={() => router.push(`/(tabs)/(trouver)/${item.id}`)}
    >
      <View className="flex-row items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {item.name}
          </Text>
          {item.group && (
            <View className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full self-start">
              <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                {item.group.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="space-y-2">
        <View className="flex-row items-center gap-2">
          <View className="bg-blue-100 dark:bg-blue-900 rounded-full p-1.5">
            <IconSymbol name="calendar" size={14} color="#3B82F6" />
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-400 flex-1">
            {formatDate(item.hours)}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="bg-red-100 dark:bg-red-900 rounded-full p-1.5">
            <IconSymbol name="location.fill" size={14} color="#EF4444" />
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-400 flex-1">
            {item.city}, {item.country}
          </Text>
        </View>

        {item.participants && (
          <View className="flex-row items-center gap-2">
            <View className="bg-purple-100 dark:bg-purple-900 rounded-full p-1.5">
              <IconSymbol name="person.2.fill" size={14} color="#8B5CF6" />
            </View>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {item.participants.length} participant{item.participants.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  if (!user) {
    return (
      <ThemedView className="flex-1">
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <View className="flex-1 items-center justify-center px-6">
            <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 items-center" style={{ width: width - 48 }}>
              <View className="bg-white/20 rounded-full p-6 mb-6">
                <IconSymbol name="calendar.badge.clock" size={80} color="#fff" />
              </View>
              <Text className="text-white text-3xl font-bold mb-3 text-center">
                Vos événements
              </Text>
              <Text className="text-white/80 text-center text-base mb-8 leading-6">
                Connectez-vous pour voir les événements auxquels vous participez et ne manquez aucune occasion de faire de nouvelles rencontres
              </Text>
              <Pressable
                className="bg-white py-4 px-8 rounded-2xl w-full active:opacity-80"
                onPress={() => router.push('/(auth)')}
              >
                <Text className="text-blue-600 text-center font-bold text-lg">
                  Se connecter
                </Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
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
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header with gradient */}
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-white text-3xl font-bold mb-2">
              Mes événements
            </Text>
            <Text className="text-white/80 text-base">
              {myParticipations.length} participation{myParticipations.length > 1 ? 's' : ''}
            </Text>
          </View>
          <View className="bg-white/20 rounded-full p-4">
            <IconSymbol name="calendar.badge.clock" size={40} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      {myParticipations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 -mt-20">
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-8 items-center shadow-lg" style={{ width: width - 48 }}>
            <View className="bg-blue-100 dark:bg-blue-900 rounded-full p-6 mb-4">
              <IconSymbol name="calendar.badge.exclamationmark" size={64} color="#3B82F6" />
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Aucun événement
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mb-6 leading-6">
              Vous ne participez à aucun événement pour le moment. Découvrez des événements passionnants autour de vous !
            </Text>
            <Pressable
              className="bg-blue-500 py-4 px-8 rounded-2xl w-full active:opacity-80"
              onPress={() => router.push('/(tabs)/(trouver)')}
            >
              <Text className="text-white text-center font-bold text-lg">
                Découvrir des événements
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={myParticipations}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}
