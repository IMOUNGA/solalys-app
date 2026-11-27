import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, SafeAreaView, Image, Dimensions, Platform, Share } from 'react-native';
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
import { GroupBadge } from '@/components/group/GroupCover';
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

  const start = new Date(currentEvent.hours);
  const end = currentEvent.endTime ? new Date(currentEvent.endTime) : null;
  const timeFr = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dayFr = start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const placeLine = currentEvent.adress || `${currentEvent.city}, ${currentEvent.country}`;
  const seatsLeft = currentEvent.maxParticipants ? Math.max(0, currentEvent.maxParticipants - participants.length) : null;
  const namedParticipants = participants.filter((p) => p.user).map((p) => p.user!.firstname);
  const participantsLine =
    namedParticipants.length === 0
      ? `${participants.length} inscrit${participants.length > 1 ? 's' : ''}`
      : namedParticipants.length <= 3 && namedParticipants.length === participants.length
        ? namedParticipants.join(', ')
        : `${namedParticipants.slice(0, 3).join(', ')} et ${participants.length - Math.min(3, namedParticipants.length)} autre${participants.length - Math.min(3, namedParticipants.length) > 1 ? 's' : ''}`;

  const openDirections = () => {
    const query = encodeURIComponent(`${placeLine}${currentEvent.adress ? `, ${currentEvent.city}` : ''}`);
    Linking.openURL(Platform.OS === 'ios' ? `http://maps.apple.com/?daddr=${query}` : `geo:0,0?q=${query}`);
  };
  const shareEvent = () =>
    Share.share({
      message: `${currentEvent.name}${currentEvent.group ? ` (${currentEvent.group.name})` : ''} · ${dayFr} à ${timeFr(start)} · ${currentEvent.city}. Sur Solalys.`,
    });
  const openGroup = () =>
    currentEvent.group &&
    router.push({
      pathname: `/(tabs)/(groupes)/${currentEvent.group.id}` as any,
      params: { returnTo: `/(tabs)/${currentTab}/${currentEvent.id}` },
    });

  return (
    <View style={{ flex: 1 }} className="bg-slate-100">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} bounces={false}>
        {/* Couverture : photo (ou bleu roi), avec la date et le titre posés dessus */}
        <View style={{ height: hasImages ? HERO_HEIGHT : 230, backgroundColor: BRAND.blue, overflow: 'hidden' }}>
          {hasImages ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => setCurrentImageIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
              scrollEventThrottle={16}
            >
              {currentEvent.images!.map((imageUrl: string, index: number) => (
                <Image key={index} source={{ uri: imageUrl }} style={{ width, height: HERO_HEIGHT }} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <>
              <View style={{ position: 'absolute', right: -70, top: -50, width: 260, height: 260, borderRadius: 130, backgroundColor: BRAND.blueLight }} />
              <View style={{ position: 'absolute', right: 56, top: 70, width: 12, height: 12, borderRadius: 6, backgroundColor: BRAND.gold }} />
            </>
          )}
          <LinearGradient
            colors={hasImages ? ['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.65)'] : ['transparent', 'transparent']}
            locations={[0, 0.35, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            pointerEvents="none"
          />
          {hasImages && currentEvent.images!.length > 1 && (
            <View className="absolute top-16 left-0 right-0 flex-row justify-center items-center gap-2">
              {currentEvent.images!.map((_: any, index: number) => (
                <View key={index} className={`h-1.5 rounded-full ${index === currentImageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
              ))}
            </View>
          )}
          <View className="absolute left-5 right-5 bottom-5 flex-row items-end gap-3">
            <View className="bg-white rounded-2xl items-center py-1.5" style={{ width: 58 }}>
              <Text style={{ color: BRAND.blue }} className="text-[11px] font-bold uppercase">
                {start.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
              </Text>
              <Text className="text-2xl font-extrabold text-gray-900 leading-7">{start.getDate()}</Text>
              <Text className="text-[10px] text-gray-500 uppercase">
                {start.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
              </Text>
            </View>
            <View className="flex-1">
              {(currentEvent.group || currentEvent.series) && (
                <Text style={{ color: '#DCE4FF' }} className="text-xs font-medium" numberOfLines={1}>
                  {[currentEvent.group?.name, currentEvent.series ? seriesRhythm(currentEvent.series).toLowerCase() : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              )}
              <Text className="text-2xl font-bold text-white" numberOfLines={2}>
                {currentEvent.name}
              </Text>
            </View>
          </View>
          <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <View className="m-4 flex-row justify-between">
              <BackButton />
              <Pressable
                onPress={shareEvent}
                accessibilityLabel="Partager l'événement"
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
              >
                <IconSymbol name="square.and.arrow.up" size={18} color="#fff" />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        {/* Infos pratiques */}
        <Section title="Infos pratiques">
          <InfoRow
            first
            icon="clock.fill"
            title={end ? `${timeFr(start)} – ${timeFr(end)}` : timeFr(start)}
            subtitle={dayFr.charAt(0).toUpperCase() + dayFr.slice(1)}
          />
          <InfoRow
            icon="location.fill"
            title={placeLine}
            subtitle={
              currentEvent.detailsHidden
                ? "L'adresse exacte s'affiche une fois inscrit"
                : [currentEvent.adress ? currentEvent.city : null, distance !== null ? `à ${formatDistance(distance)}` : null]
                    .filter(Boolean)
                    .join(' · ') || undefined
            }
            action={!currentEvent.detailsHidden ? { label: 'Itinéraire', onPress: openDirections } : undefined}
          />
          <InfoRow
            icon="ticket.fill"
            title={
              seatsLeft !== null
                ? isFull
                  ? 'Complet'
                  : `${seatsLeft} place${seatsLeft > 1 ? 's' : ''} restante${seatsLeft > 1 ? 's' : ''}`
                : 'Places illimitées'
            }
            subtitle={
              currentEvent.maxParticipants
                ? `${participants.length} inscrit${participants.length > 1 ? 's' : ''} sur ${currentEvent.maxParticipants}`
                : `${participants.length} inscrit${participants.length > 1 ? 's' : ''}`
            }
          />
          {currentEvent.link && (
            <InfoRow icon="link" title="Lien de la réunion" subtitle="Visio ou page externe" action={{ label: 'Ouvrir', onPress: () => Linking.openURL(currentEvent.link!) }} />
          )}
          {currentEvent.seriesId && (
            <InfoRow
              icon="arrow.triangle.2.circlepath"
              title={seriesRhythm(currentEvent.series)}
              subtitle={currentEvent.series && !currentEvent.series.active ? 'Récurrence arrêtée' : 'Réunion récurrente'}
              action={
                currentEvent.canManageSeries && currentEvent.series?.active !== false
                  ? { label: isStoppingRecurrence ? '...' : 'Arrêter', onPress: handleStopRecurrence, danger: true }
                  : undefined
              }
            />
          )}
        </Section>

        {/* Présence (membres du groupe) : la carte a déjà son propre titre */}
        {currentEvent.groupId && currentEvent.myAttendance !== undefined && (
          <View className="px-3 mt-4">
            <AttendanceCard event={currentEvent} onChanged={() => dispatch(fetchEventByIdThunk(currentEvent.id))} />
          </View>
        )}

        {/* Participants */}
        <Section
          title="Participants"
          action={participants.length > 0 ? { label: 'Tout voir', onPress: () => router.push(`/(tabs)/${currentTab}/${currentEvent.id}/participants` as any) } : undefined}
        >
          <View className="flex-row items-center gap-3 py-3">
            {participants.length > 0 ? (
              <>
                <View className="flex-row items-center">
                  {stackedParticipants.map((p, index) => (
                    <View key={p.id} style={{ marginLeft: index === 0 ? 0 : -10, zIndex: stackedParticipants.length - index }}>
                      <Avatar name={p.user ? `${p.user.firstname} ${p.user.lastname}` : '?'} size={34} style={{ borderWidth: 2, borderColor: '#fff' }} />
                    </View>
                  ))}
                  {overflowCount > 0 && (
                    <View className="bg-gray-100 rounded-full items-center justify-center" style={{ width: 34, height: 34, marginLeft: -10, borderWidth: 2, borderColor: '#fff' }}>
                      <Text className="text-xs font-bold text-gray-600">+{overflowCount}</Text>
                    </View>
                  )}
                </View>
                <Text className="flex-1 text-sm text-gray-600" numberOfLines={2}>
                  {participantsLine}
                </Text>
              </>
            ) : (
              <>
                <View className="bg-brand-50 rounded-full p-2.5">
                  <IconSymbol name="person.2.fill" size={18} color={BRAND.blue} />
                </View>
                <Text className="flex-1 text-sm text-gray-600">{'Personne pour l’instant. Soyez le premier à vous inscrire !'}</Text>
              </>
            )}
          </View>
        </Section>

        {/* Organisé par : le groupe (et la personne) */}
        {(currentEvent.group || currentEvent.user) && (
          <Section title="Organisé par">
            <Pressable onPress={openGroup} disabled={!currentEvent.group} className="flex-row items-center gap-3 py-3 active:opacity-70">
              {currentEvent.group ? (
                <GroupBadge name={currentEvent.group.name} size={42} inverted />
              ) : (
                <Avatar uri={currentEvent.user!.avatar} name={`${currentEvent.user!.firstname} ${currentEvent.user!.lastname}`} size={42} />
              )}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  {currentEvent.group ? currentEvent.group.name : `${currentEvent.user!.firstname} ${currentEvent.user!.lastname}`}
                </Text>
                {currentEvent.group && currentEvent.user && (
                  <Text className="text-xs text-gray-500 mt-0.5">{`par ${currentEvent.user.firstname} ${currentEvent.user.lastname}`}</Text>
                )}
              </View>
              {currentEvent.group && <IconSymbol name="chevron.right" size={16} color="#CBD5E1" />}
            </Pressable>
          </Section>
        )}

        {/* À propos */}
        {currentEvent.description && (
          <Section title="À propos">
            <Text className="text-sm text-gray-700 leading-6 py-3">{currentEvent.description}</Text>
          </Section>
        )}
      </ScrollView>
      {/* Participer / ne plus participer (rien à faire sur un événement terminé) */}
      <SafeAreaView className="bg-white dark:bg-gray-950">
        <View className="px-5 pt-3 pb-2 border-t border-gray-100 flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
              {`${start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · ${timeFr(start)}`}
            </Text>
            <Text className="text-xs text-gray-500">
              {seatsLeft !== null ? (isFull ? 'Complet' : `${seatsLeft} place${seatsLeft > 1 ? 's' : ''}`) : 'Places illimitées'}
            </Text>
          </View>
          <View style={{ flex: 1.2 }}>
          {isFinished ? (
            <View className="py-3.5 px-4 rounded-2xl bg-gray-100">
              <Text className="text-gray-500 text-center font-semibold text-base">
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
                <View className="py-3.5 px-4 rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-gray-950">
                  <Text className="text-red-500 text-center font-bold text-lg">
                    {isJoining ? 'Un instant...' : 'Me désinscrire'}
                  </Text>
                </View>
              ) : isFull ? (
                <View className="py-3.5 px-4 bg-gray-300 dark:bg-gray-700">
                  <Text className="text-white text-center font-bold text-lg">Complet</Text>
                </View>
              ) : (
                <View style={{ backgroundColor: BRAND.blue, paddingVertical: 14, paddingHorizontal: 16 }}>
                  <Text className="text-white text-center font-bold text-lg">
                    {!user ? 'Se connecter' : isJoining ? 'Un instant...' : 'Je viens'}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Bloc blanc avec un petit titre gris au-dessus (fond de page gris clair). */
function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  return (
    <View className="mt-4 px-3">
      <View className="flex-row items-center justify-between px-2 mb-1.5">
        <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</Text>
        {action && (
          <Pressable onPress={action.onPress} className="active:opacity-60">
            <Text style={{ color: BRAND.blue }} className="text-sm font-semibold">
              {action.label}
            </Text>
          </Pressable>
        )}
      </View>
      <View className="bg-white rounded-2xl px-4">{children}</View>
    </View>
  );
}

/** Ligne d'information : icône, titre, sous-titre et action facultative à droite. */
function InfoRow({
  icon,
  title,
  subtitle,
  action,
  first,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void; danger?: boolean };
  first?: boolean;
}) {
  return (
    <View className={`flex-row items-center gap-3 py-3 ${first ? '' : 'border-t border-slate-100'}`}>
      <View className="bg-brand-50 rounded-xl items-center justify-center" style={{ width: 36, height: 36 }}>
        <IconSymbol name={icon as any} size={17} color={BRAND.blue} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900">{title}</Text>
        {subtitle ? <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text> : null}
      </View>
      {action && (
        <Pressable onPress={action.onPress} className="active:opacity-60 pl-2">
          <Text style={{ color: action.danger ? '#EF4444' : BRAND.blue }} className="text-sm font-semibold">
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
