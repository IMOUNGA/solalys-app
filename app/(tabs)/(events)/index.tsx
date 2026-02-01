import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, Dimensions, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchMyParticipationsThunk, fetchMyEventsThunk } from '@/store/thunks/eventsThunks';
import { IconSymbol } from '@/components/ui/icon-symbol';

type TabType = 'participations' | 'creations';

const { width } = Dimensions.get('window');

export default function MyEventsScreen() {
  const dispatch = useAppDispatch();
  const { myParticipations, myEvents, status } = useAppSelector((state) => state.events);
  const { user, status: authStatus } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('participations');

  useEffect(() => {
    if (user && authStatus === 'authenticated') {
      dispatch(fetchMyParticipationsThunk());
      dispatch(fetchMyEventsThunk());
    }
  }, [user, authStatus]);

  const onRefresh = async () => {
    if (!user || authStatus !== 'authenticated') return;
    setRefreshing(true);
    if (activeTab === 'participations') {
      await dispatch(fetchMyParticipationsThunk());
    } else {
      await dispatch(fetchMyEventsThunk());
    }
    setRefreshing(false);
  };

  const currentEvents = activeTab === 'participations' ? myParticipations : myEvents;

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
    <View className="bg-white p-5 mb-4 rounded-2xl"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Pressable
        className="active:opacity-70"
        onPress={() => router.push(`/(tabs)/(trouver)/${item.id}`)}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              {item.name}
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="bg-violet-50 rounded-full p-1.5">
                <IconSymbol name="calendar" size={16} color="#8B5CF6" />
              </View>
              <Text className="text-sm text-gray-600 font-medium">
                {formatDate(item.hours)}
              </Text>
            </View>
          </View>
          {item.group && (
            <View className="bg-gradient-to-r from-violet-500 to-pink-500 px-3 py-1.5 rounded-full">
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
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
          <View className="flex-row items-center gap-2">
            <View className="bg-violet-50 rounded-full p-1.5">
              <IconSymbol name="person.2.fill" size={16} color="#8B5CF6" />
            </View>
            <Text className="text-sm text-gray-700 font-medium">
              {item.participants.length} participant{item.participants.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Action buttons for created events */}
      {activeTab === 'creations' && (
        <View className="flex-row gap-2 mt-4 pt-4 border-t border-gray-100">
          <Pressable
            className="flex-1 py-3 px-4 rounded-xl bg-blue-50 active:bg-blue-100 flex-row items-center justify-center gap-2"
            onPress={() => router.push(`/(tabs)/(trouver)/${item.id}/edit` as any)}
          >
            <IconSymbol name="pencil" size={18} color="#3B82F6" />
            <Text className="text-blue-600 font-semibold">Modifier</Text>
          </Pressable>
          <Pressable
            className="flex-1 py-3 px-4 rounded-xl bg-red-50 active:bg-red-100 flex-row items-center justify-center gap-2"
            onPress={() => {
              // TODO: Add delete confirmation
              console.log('Delete event', item.id);
            }}
          >
            <IconSymbol name="trash" size={18} color="#EF4444" />
            <Text className="text-red-600 font-semibold">Supprimer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  if (!user) {
    return (
      <View className="flex-1 bg-white">
        <LinearGradient
          colors={['#8B5CF6', '#EC4899', '#FFFFFF']}
          locations={[0, 0.5, 1]}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1">
            <View className="flex-1 items-center justify-center px-6">
              <View className="bg-white/20 backdrop-blur-xl rounded-full p-6 mb-6">
                <IconSymbol name="calendar.badge.clock" size={64} color="#fff" />
              </View>
              <Text className="text-white text-2xl font-bold text-center mb-3">
                Vos événements
              </Text>
              <Text className="text-white/90 text-center text-base mb-8 leading-6">
                Connectez-vous pour voir vos participations et ne manquez aucune occasion
              </Text>
              <Pressable
                className="px-8 py-4 rounded-2xl active:opacity-80"
                onPress={() => router.push('/(auth)')}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F3F4F6']}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                />
                <Text className="text-violet-600 font-bold text-lg relative z-10">
                  Se connecter
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (status === 'loading' && myParticipations.length === 0 && myEvents.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <LinearGradient
          colors={['#8B5CF6', '#EC4899', '#FFFFFF']}
          locations={[0, 0.3, 0.7]}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1">
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#fff" />
              <Text className="text-white font-medium mt-4">Chargement de vos événements...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={['#8B5CF6', '#EC4899', '#FFFFFF']}
        locations={[0, 0.4, 0.8]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <Text className="text-white text-3xl font-bold mb-4">
            Mes événements
          </Text>

          {/* Tabs */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setActiveTab('participations')}
              className={`flex-1 py-3 px-4 rounded-xl ${
                activeTab === 'participations' ? 'bg-white' : 'bg-white/20'
              }`}
            >
              <Text className={`text-center font-bold ${
                activeTab === 'participations' ? 'text-violet-600' : 'text-white'
              }`}>
                Participations
              </Text>
              <Text className={`text-center text-sm mt-1 ${
                activeTab === 'participations' ? 'text-violet-500' : 'text-white/80'
              }`}>
                {myParticipations.length}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('creations')}
              className={`flex-1 py-3 px-4 rounded-xl ${
                activeTab === 'creations' ? 'bg-white' : 'bg-white/20'
              }`}
            >
              <Text className={`text-center font-bold ${
                activeTab === 'creations' ? 'text-violet-600' : 'text-white'
              }`}>
                Mes créations
              </Text>
              <Text className={`text-center text-sm mt-1 ${
                activeTab === 'creations' ? 'text-violet-500' : 'text-white/80'
              }`}>
                {myEvents.length}
              </Text>
            </Pressable>
          </View>
        </View>

        {currentEvents.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="bg-white p-8 rounded-3xl items-center"
              style={{
                width: width - 48,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <View className="bg-violet-100 rounded-full p-6 mb-4">
                <IconSymbol name="calendar.badge.exclamationmark" size={56} color="#8B5CF6" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                {activeTab === 'participations' ? 'Aucune participation' : 'Aucune création'}
              </Text>
              <Text className="text-gray-600 text-center mb-6 leading-6">
                {activeTab === 'participations'
                  ? 'Vous ne participez à aucun événement. Découvrez-en autour de vous !'
                  : 'Vous n\'avez créé aucun événement. Créez-en un pour rassembler votre communauté !'}
              </Text>
              <Pressable
                className="py-4 px-8 rounded-2xl w-full active:opacity-80"
                onPress={() => router.push(activeTab === 'participations' ? '/(tabs)/(trouver)' : '/(tabs)/(trouver)/create')}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                />
                <Text className="text-white text-center font-bold text-lg relative z-10">
                  {activeTab === 'participations' ? 'Découvrir des événements' : 'Créer un événement'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <FlatList
            data={currentEvents}
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
          />
        )}
      </SafeAreaView>
    </View>
  );
}
