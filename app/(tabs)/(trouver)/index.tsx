import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchEventsThunk } from '@/store/thunks/eventsThunks';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';

export default function TrouverScreen() {
  const dispatch = useAppDispatch();
  const { events, status } = useAppSelector((state) => state.events);
  const { user, status: authStatus } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user && authStatus === 'authenticated') {
      dispatch(fetchEventsThunk({}));
    }
  }, [user, authStatus]);

  const onRefresh = async () => {
    if (!user || authStatus !== 'authenticated') return;
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
      className="bg-white p-5 mb-4 rounded-2xl active:opacity-70"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
      onPress={() => router.push(`/(tabs)/(trouver)/${item.id}`)}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-3">
          <Text className="text-lg font-bold text-gray-900 mb-2">
            {item.name}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="bg-blue-50 rounded-full p-1.5">
              <IconSymbol name="calendar" size={16} color="#3B82F6" />
            </View>
            <Text className="text-sm text-gray-600 font-medium">
              {formatDate(item.hours)}
            </Text>
          </View>
        </View>
        {item.group && (
          <View className="bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-1.5 rounded-full">
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 100 }}
            />
            <Text className="text-xs font-bold text-white relative z-10">
              {item.group.name}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center gap-2 mb-3">
        <View className="bg-gray-50 rounded-full p-1.5">
          <IconSymbol name="location.fill" size={16} color="#6B7280" />
        </View>
        <Text className="text-sm text-gray-600">
          {item.city}, {item.country}
        </Text>
      </View>

      {item.participants && item.participants.length > 0 && (
        <View className="flex-row items-center gap-2 pt-3 border-t border-gray-100">
          <View className="bg-green-50 rounded-full p-1.5">
            <IconSymbol name="person.2.fill" size={16} color="#10B981" />
          </View>
          <Text className="text-sm text-gray-700 font-medium">
            {item.participants.length} participant{item.participants.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </Pressable>
  );

  if (!user) {
    return (
      <View className="flex-1 bg-white">
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6', '#FFFFFF']}
          locations={[0, 0.5, 1]}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1">
            <View className="flex-1 items-center justify-center px-6">
              <View className="bg-white/20 backdrop-blur-xl rounded-full p-6 mb-6">
                <IconSymbol name="calendar.badge.exclamationmark" size={64} color="#fff" />
              </View>
              <Text className="text-white text-2xl font-bold text-center mb-3">
                Découvrez des événements
              </Text>
              <Text className="text-white/90 text-center text-base mb-8 leading-6">
                Connectez-vous pour participer à des événements locaux et rencontrer du monde
              </Text>
              <Pressable
                className="px-8 py-4 rounded-2xl active:opacity-80"
                onPress={() => router.push('/(auth)')}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F3F4F6']}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                />
                <Text className="text-blue-600 font-bold text-lg relative z-10">
                  Se connecter
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (status === 'loading' && events.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6', '#FFFFFF']}
          locations={[0, 0.3, 0.7]}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1">
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#fff" />
              <Text className="text-white font-medium mt-4">Chargement des événements...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6', '#FFFFFF']}
        locations={[0, 0.4, 0.8]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-white text-3xl font-bold mb-2">
            Événements
          </Text>
          <Text className="text-white/90 text-base">
            Découvrez les événements près de chez vous
          </Text>
        </View>

        {/* Liste des événements */}
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <IconSymbol name="calendar.badge.exclamationmark" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 font-semibold text-lg mb-2">
                Aucun événement
              </Text>
              <Text className="text-gray-500 text-center px-8">
                Il n'y a pas d'événements disponibles pour le moment
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}
