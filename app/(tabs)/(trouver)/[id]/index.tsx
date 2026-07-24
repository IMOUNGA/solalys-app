import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, SafeAreaView, Image, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchEventByIdThunk, joinEventThunk, leaveEventThunk } from '@/store/thunks/eventsThunks';
import { clearCurrentEvent } from '@/store/slices/eventsSlice';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { calculateDistance, formatDistance } from '@/utils/distance';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = width * 0.72;
const MAX_STACKED_AVATARS = 5;

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
    return () => {
      dispatch(clearCurrentEvent());
    };
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
    if (!currentEvent) return;

    if (!user) {
      router.push('/(auth)');
      return;
    }

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

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || !currentEvent) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 dark:text-gray-400 mt-4">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasImages = currentEvent.images && currentEvent.images.length > 0;
  const distance =
    userLocation && currentEvent.latitude && currentEvent.longitude
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          currentEvent.latitude,
          currentEvent.longitude
        )
      : null;
  const participants = currentEvent.participants || [];
  const stackedParticipants = participants.slice(0, MAX_STACKED_AVATARS);
  const overflowCount = participants.length - stackedParticipants.length;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} bounces={false}>
        {/* Hero */}
        <View style={{ height: HERO_HEIGHT }}>
          {hasImages ? (
            <>
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
                {currentEvent.images!.map((imageUrl: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: imageUrl }}
                    style={{ width, height: HERO_HEIGHT }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>

              {/* Dégradé pour la lisibilité du bouton retour + des indicateurs */}
              <LinearGradient
                colors={['rgba(0,0,0,0.35)', 'transparent']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100 }}
                pointerEvents="none"
              />

              {currentEvent.images!.length > 1 && (
                <View className="absolute bottom-4 left-0 right-0 flex-row justify-center items-center gap-2">
                  {currentEvent.images!.map((_: any, index: number) => (
                    <View
                      key={index}
                      className={`h-1.5 rounded-full ${
                        index === currentImageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <View className="bg-white/15 rounded-full p-6">
                <IconSymbol name="calendar" size={44} color="#fff" />
              </View>
            </LinearGradient>
          )}

          {/* Bouton retour flottant */}
          <SafeAreaView style={{ position: 'absolute', top: 0, left: 0 }}>
            <Pressable
              onPress={() => router.back()}
              className="m-4 bg-black/30 rounded-full w-10 h-10 items-center justify-center active:bg-black/50"
            >
              <IconSymbol name="chevron.left" size={22} color="#fff" />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Carte de contenu */}
        <View
          className="bg-white dark:bg-gray-950 px-5 pt-6 pb-8"
          style={{ marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          {currentEvent.group && (
            <View className="bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full self-start mb-3">
              <Text className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {currentEvent.group.name}
              </Text>
            </View>
          )}

          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {currentEvent.name}
          </Text>

          {/* Chips résumé */}
          <View className="flex-row flex-wrap gap-2 mb-6">
            <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-900 rounded-full px-3 py-1.5">
              <IconSymbol name="calendar" size={14} color="#3B82F6" />
              <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {formatShortDate(currentEvent.hours)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-900 rounded-full px-3 py-1.5">
              <IconSymbol name="person.2.fill" size={14} color="#8B5CF6" />
              <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {participants.length} participant{participants.length > 1 ? 's' : ''}
              </Text>
            </View>
            {distance !== null && (
              <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-900 rounded-full px-3 py-1.5">
                <IconSymbol name="location.circle.fill" size={14} color="#EF4444" />
                <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {formatDistance(distance)}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {currentEvent.description && (
            <View className="mb-6">
              <Text className="text-base font-bold text-gray-900 dark:text-white mb-2">
                À propos
              </Text>
              <Text className="text-base text-gray-600 dark:text-gray-400 leading-6">
                {currentEvent.description}
              </Text>
            </View>
          )}

          <View className="border-t border-gray-100 dark:border-gray-800 mb-6" />

          {/* Infos pratiques */}
          <View className="gap-5 mb-6">
            <View className="flex-row items-start gap-3">
              <View className="bg-blue-50 dark:bg-blue-950 rounded-full p-2">
                <IconSymbol name="calendar" size={18} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Date et heure</Text>
                <Text className="text-base text-gray-900 dark:text-white font-medium capitalize">
                  {formatDate(currentEvent.hours)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3">
              <View className="bg-red-50 dark:bg-red-950 rounded-full p-2">
                <IconSymbol name="location.fill" size={18} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Lieu</Text>
                <Text className="text-base text-gray-900 dark:text-white font-medium">
                  {currentEvent.adress || `${currentEvent.city}, ${currentEvent.country}`}
                </Text>
                {distance !== null && (
                  <Text className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                    {formatDistance(distance)} de vous
                  </Text>
                )}
              </View>
            </View>

            {currentEvent.link && (
              <View className="flex-row items-start gap-3">
                <View className="bg-amber-50 dark:bg-amber-950 rounded-full p-2">
                  <IconSymbol name="link" size={18} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lien</Text>
                  <Pressable
                    onPress={() => Linking.openURL(currentEvent.link!)}
                    className="self-start bg-amber-50 dark:bg-amber-950 rounded-full px-4 py-2 active:opacity-70"
                  >
                    <Text className="text-sm text-amber-700 dark:text-amber-300 font-semibold">
                      Ouvrir le lien
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <View className="border-t border-gray-100 dark:border-gray-800 mb-6" />

          {/* Organisateur */}
          {currentEvent.user && (
            <View className="mb-6">
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">Organisé par</Text>
              <View className="flex-row items-center gap-3">
                <Avatar
                  uri={currentEvent.user.avatar}
                  name={`${currentEvent.user.firstname} ${currentEvent.user.lastname}`}
                  size={48}
                />
                <Text className="text-base text-gray-900 dark:text-white font-semibold">
                  {currentEvent.user.firstname} {currentEvent.user.lastname}
                </Text>
              </View>
            </View>
          )}

          {/* Groupe organisateur — mise en avant */}
          {currentEvent.group && (
            <Pressable
              onPress={() => router.push(`/(tabs)/(groupes)/${currentEvent.group!.id}` as any)}
              className="active:opacity-80 mb-6"
            >
              <View className="flex-row items-center gap-3 bg-blue-50 dark:bg-blue-950 rounded-2xl p-4">
                <View className="bg-white dark:bg-gray-800 rounded-full p-2.5">
                  <IconSymbol name="person.2.fill" size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 dark:text-white">
                    Infos sur le groupe
                  </Text>
                  <Text className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {currentEvent.group.name}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color="#3B82F6" />
              </View>
            </Pressable>
          )}

          {/* Participants */}
          <Pressable
            onPress={() => router.push(`/(tabs)/(trouver)/${currentEvent.id}/participants`)}
            className="active:opacity-70"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {participants.length > 0
                  ? `Participants (${participants.length})`
                  : 'Personne ne participe pour l\'instant'}
              </Text>
              {participants.length > 0 && (
                <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
              )}
            </View>
            {participants.length > 0 ? (
              <View className="flex-row items-center">
                {stackedParticipants.map((p, index) => (
                  <View
                    key={p.id}
                    style={{ marginLeft: index === 0 ? 0 : -12, zIndex: stackedParticipants.length - index }}
                  >
                    <Avatar
                      name={p.user ? `${p.user.firstname} ${p.user.lastname}` : '?'}
                      size={36}
                      style={{ borderWidth: 2, borderColor: '#fff' }}
                    />
                  </View>
                ))}
                {overflowCount > 0 && (
                  <View
                    className="bg-gray-200 dark:bg-gray-800 rounded-full items-center justify-center"
                    style={{ width: 36, height: 36, marginLeft: -12, borderWidth: 2, borderColor: '#fff' }}
                  >
                    <Text className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      +{overflowCount}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text className="text-base text-gray-400 dark:text-gray-500">
                Soyez le premier à rejoindre !
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Join/Leave Button */}
      <View className="p-5 pt-3 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <Pressable
          className={`rounded-2xl overflow-hidden ${isJoining ? 'opacity-60' : 'active:opacity-90'}`}
          onPress={handleJoinLeave}
          disabled={isJoining}
        >
          {isParticipating ? (
            <View className="py-4 px-6 bg-red-500">
              <Text className="text-white text-center font-bold text-lg">
                {isJoining ? 'Chargement...' : 'Ne plus participer'}
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, paddingHorizontal: 24 }}
            >
              <Text className="text-white text-center font-bold text-lg">
                {!user ? 'Se connecter pour participer' : isJoining ? 'Chargement...' : 'Participer'}
              </Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
