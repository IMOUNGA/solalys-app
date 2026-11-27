import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, SafeAreaView, Image, Dimensions } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useSegments } from 'expo-router';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchEventByIdThunk, joinEventThunk, leaveEventThunk } from '@/store/thunks/eventsThunks';
import type { Event } from '@/types/event';
import { weeklyRhythm } from '@/lib/rhythm';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/ui/BackButton';
import { useSuccessAlert, useErrorAlert, useConfirmAlert } from '@/hooks/useAlert';
import { calculateDistance, formatDistance } from '@/utils/distance';
import { apiService } from '@/services/apiService';
import { AttendanceCard } from '@/components/event/AttendanceCard';
import { GroupCover } from '@/components/group/GroupCover';
import { BRAND } from '@/lib/brand';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = width * 0.72;
const MAX_STACKED_AVATARS = 5;

/** « Tous les mardis à 08h00 » ; texte générique si le rythme n'est pas connu. */
function seriesRhythm(series: Event['series']): string {
  return weeklyRhythm(series?.dayOfWeek, series?.startTime) ?? "Fait partie d'une série récurrente";
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const segments = useSegments();
  // Cet écran est monté à la fois sous (trouver) et sous (events) (voir
  // (events)/[id]/index.tsx, simple ré-export) — on reste dans l'onglet
  // d'où on vient pour que le bouton retour ne saute pas de tab.
  const currentTab = (segments as string[]).includes('(events)') ? '(events)' : '(trouver)';
  const dispatch = useAppDispatch();
  const eventId = Number(id);
  const { currentEvent: storedEvent, status } = useAppSelector((state) => state.events);
  // Le store ne garde qu'un événement à la fois, partagé par tous les écrans
  // ouverts (plusieurs onglets) : on n'affiche que celui de CET écran.
  const currentEvent = storedEvent && storedEvent.id === eventId ? storedEvent : null;
  const { user } = useAppSelector((state) => state.auth);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();
  const showConfirm = useConfirmAlert();
  const [isStoppingRecurrence, setIsStoppingRecurrence] = useState(false);

  // À chaque retour sur l'écran : recharger si le store contient un autre événement.
  // (Pas d'effacement au démontage : il vidait l'événement d'un autre écran resté ouvert.)
  useFocusEffect(
    useCallback(() => {
      if (!isNaN(eventId) && storedEvent?.id !== eventId) {
        dispatch(fetchEventByIdThunk(eventId));
      }
    }, [dispatch, eventId, storedEvent?.id]),
  );

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

  const handleStopRecurrence = () => {
    if (!currentEvent?.seriesId) return;

    showConfirm(
      'Les prochaines occurrences ne seront plus générées automatiquement. Les événements déjà créés (dont celui-ci) restent inchangés.',
      async () => {
        setIsStoppingRecurrence(true);
        try {
          await apiService.recurringEvents.update(currentEvent.seriesId!, { active: false });
          showSuccess('Récurrence arrêtée');
          await dispatch(fetchEventByIdThunk(currentEvent.id));
        } catch (error: any) {
          showError(error?.response?.data?.message || 'Une erreur est survenue');
        } finally {
          setIsStoppingRecurrence(false);
        }
      },
      'Arrêter la récurrence ?',
      'Arrêter',
    );
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

  if (!currentEvent) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
        <View className="flex-1 items-center justify-center px-8">
          {status === 'failed' ? (
            <>
              <IconSymbol name="exclamationmark.triangle.fill" size={40} color="#F59E0B" />
              <Text className="text-gray-900 dark:text-white font-semibold text-lg mt-4 text-center">
                {'Impossible de charger cet événement'}
              </Text>
              <Pressable
                onPress={() => dispatch(fetchEventByIdThunk(eventId))}
                style={{ backgroundColor: BRAND.blue }}
                className="mt-5 px-6 py-3 rounded-xl active:opacity-80"
              >
                <Text className="text-white font-semibold">Réessayer</Text>
              </Pressable>
              <Pressable onPress={() => router.back()} className="mt-3 py-2 active:opacity-60">
                <Text className="text-gray-500 dark:text-gray-400">Retour</Text>
              </Pressable>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={BRAND.blue} />
              <Text className="text-gray-500 dark:text-gray-400 mt-4">Chargement...</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const hasImages = currentEvent.images && currentEvent.images.length > 0;
  // Terminé : après la fin (ou le début si pas d'heure de fin), comme le refuse le serveur.
  const isFinished = new Date(currentEvent.endTime ?? currentEvent.hours).getTime() < Date.now();
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
  const stackedParticipants = participants.filter((p) => p.user).slice(0, MAX_STACKED_AVATARS);
  const overflowCount = participants.length - stackedParticipants.length;
  const isFull = !!currentEvent.maxParticipants && participants.length >= currentEvent.maxParticipants;

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} bounces={false}>
        {/* Hero */}
        {/* Sans photo : couverture bleu roi plus courte, aux initiales du groupe */}
        <View style={{ height: hasImages ? HERO_HEIGHT : 220 }}>
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
            <GroupCover name={currentEvent.group?.name ?? currentEvent.name} height={220} />
          )}

          {/* Bouton retour flottant */}
          <SafeAreaView style={{ position: 'absolute', top: 0, left: 0 }}>
            <View className="m-4">
              <BackButton />
            </View>
          </SafeAreaView>
        </View>

        {/* Carte de contenu */}
        <View
          className="bg-white dark:bg-gray-950 px-5 pt-6 pb-8"
          style={{ marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          {currentEvent.group && (
            <View className="bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-full self-start mb-3">
              <Text className="text-sm font-semibold text-brand-600 dark:text-brand-300">
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
              <IconSymbol name="calendar" size={14} color="#2345C2" />
              <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {formatShortDate(currentEvent.hours)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-900 rounded-full px-3 py-1.5">
              <IconSymbol name="person.2.fill" size={14} color="#2345C2" />
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
              <View className="bg-brand-50 dark:bg-brand-950 rounded-full p-2">
                <IconSymbol name="calendar" size={18} color="#2345C2" />
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
                {currentEvent.detailsHidden && (
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {"L'adresse exacte s'affiche une fois inscrit."}
                  </Text>
                )}
                {distance !== null && (
                  <Text className="text-sm text-brand-600 dark:text-brand-300 font-semibold mt-0.5">
                    {currentEvent.detailsHidden ? 'Environ ' : ''}
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
              onPress={() =>
                router.push({
                  pathname: `/(tabs)/(groupes)/${currentEvent.group!.id}` as any,
                  params: { returnTo: `/(tabs)/${currentTab}/${currentEvent.id}` },
                })
              }
              className="active:opacity-80 mb-6"
            >
              <View className="flex-row items-center gap-3 bg-brand-50 dark:bg-brand-950 rounded-2xl p-4">
                <View className="bg-white dark:bg-gray-800 rounded-full p-2.5">
                  <IconSymbol name="person.2.fill" size={20} color="#2345C2" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 dark:text-white">
                    Infos sur le groupe
                  </Text>
                  <Text className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {currentEvent.group.name}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color="#2345C2" />
              </View>
            </Pressable>
          )}

          {/* Événement récurrent */}
          {currentEvent.seriesId && (
            <View className="flex-row items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-6">
              <View className="bg-white dark:bg-gray-800 rounded-full p-2.5">
                <IconSymbol name="arrow.triangle.2.circlepath" size={18} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {seriesRhythm(currentEvent.series)}
                </Text>
                {currentEvent.series && !currentEvent.series.active && (
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Récurrence arrêtée</Text>
                )}
              </View>
              {currentEvent.canManageSeries && currentEvent.series?.active !== false && (
                <Pressable onPress={handleStopRecurrence} disabled={isStoppingRecurrence} className="active:opacity-70">
                  <Text className="text-xs font-semibold text-red-500">
                    {isStoppingRecurrence ? '...' : 'Arrêter'}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <AttendanceCard event={currentEvent} onChanged={() => dispatch(fetchEventByIdThunk(currentEvent.id))} />

          {/* Participants */}
          <Pressable
            onPress={() => router.push(`/(tabs)/${currentTab}/${currentEvent.id}/participants` as any)}
            className="active:opacity-70"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {currentEvent.maxParticipants
                  ? `Participants (${participants.length}/${currentEvent.maxParticipants})`
                  : participants.length > 0
                  ? `Participants (${participants.length})`
                  : 'Personne ne participe pour l\'instant'}
              </Text>
              <View className="flex-row items-center gap-2">
                {isFull && (
                  <View className="bg-red-50 dark:bg-red-950 rounded-full px-2 py-0.5">
                    <Text className="text-xs font-bold text-red-500">Complet</Text>
                  </View>
                )}
                {participants.length > 0 && (
                  <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
                )}
              </View>
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

      {/* Participer / ne plus participer (rien à faire sur un événement terminé) */}
      <SafeAreaView className="bg-white dark:bg-gray-950">
        <View className="p-5 pt-3 border-t border-gray-100 dark:border-gray-800">
          {isFinished ? (
            <View className="py-4 px-6 rounded-2xl bg-gray-100 dark:bg-gray-900">
              <Text className="text-gray-500 dark:text-gray-400 text-center font-semibold text-base">
                {'Événement terminé'}
              </Text>
            </View>
          ) : (
            <Pressable
              className={`rounded-2xl overflow-hidden ${isJoining || (isFull && !isParticipating) ? 'opacity-60' : 'active:opacity-90'}`}
              onPress={handleJoinLeave}
              disabled={isJoining || (isFull && !isParticipating)}
            >
              {isParticipating ? (
                <View className="py-4 px-6 rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-gray-950">
                  <Text className="text-red-500 text-center font-bold text-lg">
                    {isJoining ? 'Un instant...' : 'Ne plus participer'}
                  </Text>
                </View>
              ) : isFull ? (
                <View className="py-4 px-6 bg-gray-300 dark:bg-gray-700">
                  <Text className="text-white text-center font-bold text-lg">Complet</Text>
                </View>
              ) : (
                <View style={{ backgroundColor: BRAND.blue, paddingVertical: 16, paddingHorizontal: 24 }}>
                  <Text className="text-white text-center font-bold text-lg">
                    {!user ? 'Se connecter pour participer' : isJoining ? 'Un instant...' : 'Participer'}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
