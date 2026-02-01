import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, SafeAreaView, Image, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchEventByIdThunk, joinEventThunk, leaveEventThunk } from '@/store/thunks/eventsThunks';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { calculateDistance, formatDistance } from '@/utils/distance';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { currentEvent, status } = useAppSelector((state) => state.events);
  const { user } = useAppSelector((state) => state.auth);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  useEffect(() => {
    if (id && !isNaN(Number(id))) {
      dispatch(fetchEventByIdThunk(Number(id)));
    }
  }, [id]);

  useEffect(() => {
    if (currentEvent && user) {
      const participating = currentEvent.participants?.some(
        (p) => p.userId === user.id
      );
      setIsParticipating(participating || false);
    }
  }, [currentEvent, user]);

  // Obtenir la position de l'utilisateur au chargement
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log('Could not get location:', error);
      }
    };

    getUserLocation();
  }, []);

  const handleJoinLeave = async () => {
    if (!currentEvent || !user) return;

    setIsJoining(true);
    try {
      if (isParticipating) {
        await dispatch(leaveEventThunk(currentEvent.id)).unwrap();
        showSuccess('Vous ne participez plus à cet événement');
      } else {
        await dispatch(joinEventThunk(currentEvent.id)).unwrap();
        showSuccess('Participation confirmée !');
      }
      // Refresh event
      await dispatch(fetchEventByIdThunk(currentEvent.id));
    } catch (error: any) {
      showError(error.message || 'Une erreur est survenue');
    } finally {
      setIsJoining(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || !currentEvent) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="text-gray-500 mt-4">Chargement...</Text>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Header */}
          <View className="p-5 pb-6 border-b border-gray-200 dark:border-gray-800">
            <Pressable onPress={() => router.back()} className="mb-4">
              <IconSymbol name="chevron.left" size={24} color="#000" />
            </Pressable>

          <ThemedText type="title" className="mb-3">
            {currentEvent.name}
          </ThemedText>

          {currentEvent.group && (
            <View className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full self-start">
              <Text className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {currentEvent.group.name}
              </Text>
            </View>
          )}
        </View>

        {/* Images Carousel */}
        {currentEvent.images && currentEvent.images.length > 0 && (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const x = event.nativeEvent.contentOffset.x;
                const index = Math.round(x / width);
                setCurrentImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {currentEvent.images.map((imageUrl: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={{ width, height: width * 0.6 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Indicateurs de pagination */}
            {currentEvent.images.length > 1 && (
              <View className="flex-row justify-center items-center py-3 gap-2">
                {currentEvent.images.map((_: any, index: number) => (
                  <View
                    key={index}
                    className={`h-2 rounded-full ${
                      index === currentImageIndex
                        ? 'w-6 bg-blue-600'
                        : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Info */}
        <View className="p-5 space-y-4">
          {/* Date */}
          <View className="flex-row items-start gap-3">
            <IconSymbol name="calendar" size={20} color="#3B82F6" />
            <View className="flex-1">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date et heure</Text>
              <Text className="text-base text-gray-900 dark:text-white font-medium">
                {formatDate(currentEvent.hours)}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View className="flex-row items-start gap-3">
            <IconSymbol name="location.fill" size={20} color="#EF4444" />
            <View className="flex-1">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lieu</Text>
              <Text className="text-base text-gray-900 dark:text-white font-medium">
                {currentEvent.adress || `${currentEvent.city}, ${currentEvent.country}`}
              </Text>
              {userLocation && currentEvent.latitude && currentEvent.longitude && (() => {
                const distance = calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  currentEvent.latitude,
                  currentEvent.longitude
                );
                return (
                  <View className="flex-row items-center gap-1 mt-1">
                    <IconSymbol name="location.circle.fill" size={14} color="#3B82F6" />
                    <Text className="text-sm text-blue-600 font-semibold">
                      {formatDistance(distance)} de vous
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>

          {/* Creator */}
          {currentEvent.user && (
            <View className="flex-row items-center gap-3">
              <Avatar
                uri={currentEvent.user.avatar}
                name={`${currentEvent.user.firstname} ${currentEvent.user.lastname}`}
                size={48}
              />
              <View className="flex-1">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Organisateur</Text>
                <Text className="text-base text-gray-900 dark:text-white font-medium">
                  {currentEvent.user.firstname} {currentEvent.user.lastname}
                </Text>
              </View>
            </View>
          )}

          {/* Participants */}
          <View className="flex-row items-start gap-3">
            <IconSymbol name="person.2.fill" size={20} color="#8B5CF6" />
            <View className="flex-1">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Participants</Text>
              <Text className="text-base text-gray-900 dark:text-white font-medium">
                {currentEvent.participants?.length || 0} personne{currentEvent.participants && currentEvent.participants.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Link */}
          {currentEvent.link && (
            <View className="flex-row items-start gap-3">
              <IconSymbol name="link" size={20} color="#F59E0B" />
              <View className="flex-1">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lien</Text>
                <Pressable onPress={() => Linking.openURL(currentEvent.link!)}>
                  <Text className="text-base text-blue-600 dark:text-blue-400 underline">
                    Ouvrir le lien
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Join/Leave Button */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <Pressable
          className={`py-4 px-6 rounded-xl ${
            isParticipating
              ? 'bg-red-500 active:bg-red-600'
              : 'bg-blue-500 active:bg-blue-600'
          } ${isJoining ? 'opacity-50' : ''}`}
          onPress={handleJoinLeave}
          disabled={isJoining}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {isJoining
              ? 'Chargement...'
              : isParticipating
              ? 'Ne plus participer'
              : 'Participer'}
          </Text>
        </Pressable>
      </View>
      </ThemedView>
    </SafeAreaView>
  );
}
