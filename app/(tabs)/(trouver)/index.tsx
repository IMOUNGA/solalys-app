import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, SafeAreaView, TextInput, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchEventsThunk } from '@/store/thunks/eventsThunks';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/apiService';
import { calculateDistance, formatDistance } from '@/utils/distance';
import { NotificationBell } from '@/components/NotificationBell';
import { GroupDiscoverCard } from '@/components/group/GroupDiscoverCard';
import { EventThumb } from '@/components/event/EventThumb';
import type { DiscoverGroup } from '@/services/apiService';
import { BRAND } from '@/lib/brand';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function TrouverScreen() {
  const dispatch = useAppDispatch();
  const { events, status } = useAppSelector((state) => state.events);
  const { user, status: authStatus } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  // États de recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [useGeolocation, setUseGeolocation] = useState(false);
  const [radius, setRadius] = useState(10);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [debouncedRadius, setDebouncedRadius] = useState(10);
  const [thisWeek, setThisWeek] = useState(false);
  const [nearbyGroups, setNearbyGroups] = useState<DiscoverGroup[]>([]);

  useEffect(() => {
    dispatch(fetchEventsThunk({}));
  }, []);

  // Récupérer la position de l'utilisateur au chargement (silencieusement si autorisé)
  useEffect(() => {
    const getInitialLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(coords);
        }
      } catch (error) {
        console.log('Could not get initial location:', error);
      }
    };

    getInitialLocation();
  }, []);

  // Debounce de la recherche textuelle (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce du rayon (800ms pour laisser le temps de bouger le slider)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRadius(radius);
    }, 800);

    return () => clearTimeout(timer);
  }, [radius]);

  // Groupes près de chez vous (ou les plus actifs sans position connue).
  const loadNearbyGroups = useCallback(async () => {
    try {
      const res = await apiService.groups.discover(
        userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude, radius: 50, limit: 10 } : { limit: 10 },
      );
      setNearbyGroups(res.data || []);
    } catch {
      setNearbyGroups([]);
    }
  }, [userLocation]);

  useEffect(() => {
    loadNearbyGroups();
  }, [loadNearbyGroups, user?.id]);

  // Recherche automatique dès 3 caractères ou si géolocalisation activée
  useEffect(() => {
    const performAutoSearch = async () => {
      const shouldSearch =
        (debouncedQuery.trim().length >= 3) ||
        (useGeolocation && userLocation);

      if (!shouldSearch) {
        return;
      }

      setIsSearching(true);
      try {
        const response = await apiService.events.search(
          debouncedQuery.trim() || undefined,
          useGeolocation ? userLocation?.latitude : undefined,
          useGeolocation ? userLocation?.longitude : undefined,
          debouncedRadius,
          1,
          50
        );

        setSearchResults(response.data.data || []);
        setHasSearched(true);
      } catch (error: any) {
        console.error('Auto search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    performAutoSearch();
  }, [debouncedQuery, useGeolocation, debouncedRadius, userLocation, user, authStatus]);

  // Demander permission géolocalisation
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Nous avons besoin de votre position pour rechercher les événements autour de vous.'
        );
        setUseGeolocation(false);
        return false;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      return true;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre position.');
      setUseGeolocation(false);
      return false;
    }
  };

  // Toggle géolocalisation
  const handleGeolocationToggle = async (value: boolean) => {
    setUseGeolocation(value);
    if (value) {
      await requestLocationPermission();
    } else {
      setUserLocation(null);
    }
  };

  // Reset recherche
  const handleResetSearch = () => {
    setSearchQuery('');
    setUseGeolocation(false);
    setUserLocation(null);
    setSearchResults([]);
    setShowFilters(false);
    setHasSearched(false);
    setThisWeek(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    handleResetSearch();
    await Promise.all([dispatch(fetchEventsThunk({})), loadNearbyGroups()]);
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

  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const renderEvent = ({ item }: any) => {
    // Calculer la distance si la géolocalisation est activée
    let distance: number | null = null;
    if (userLocation && item.latitude && item.longitude) {
      distance = calculateDistance(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude);
    }

    const hasImage = item.images && item.images.length > 0;
    const isParticipating = user && item.participants?.some((p: any) => p.userId === Number(user.id));

    return (
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
        <View className="flex-row gap-3 mb-3">
          {/* Contenu à gauche */}
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>
              {item.name}
            </Text>
            {item.group && (
              <Text className="text-xs text-brand-600 font-semibold mt-0.5 mb-1">
                {item.group.name}
              </Text>
            )}
            {item.description && (
              <Text className="text-sm text-gray-600 mb-2 leading-5">
                {truncateDescription(item.description)}
              </Text>
            )}
            <View className="flex-row items-center gap-2">
              <View className="bg-brand-50 rounded-full p-1.5">
                <IconSymbol name="calendar" size={16} color="#2345C2" />
              </View>
              <Text className="text-sm text-gray-600 font-medium">
                {formatDate(item.hours)}
              </Text>
            </View>
          </View>

          {/* Vignette à droite : photo, sinon bleu roi aux initiales du groupe */}
          <EventThumb image={hasImage ? item.images[0] : null} name={item.group?.name ?? item.name} />
        </View>

        <View className="flex-row items-center gap-2 mb-3">
          <View className="bg-brand-50 rounded-full p-1.5">
            <IconSymbol name="location.fill" size={16} color={BRAND.blue} />
          </View>
          <View className="flex-1 flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">
              {item.city}, {item.country}
            </Text>
            {distance !== null && (
              <View className="bg-brand-50 px-2 py-1 rounded-full">
                <Text className="text-xs font-bold text-brand-600">
                  {formatDistance(distance)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {(item.participants?.length > 0 || isParticipating) && (
          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
            <View className="flex-row items-center gap-2">
              {item.participants && item.participants.length > 0 && (
                <>
                  <View className="bg-brand-50 rounded-full p-1.5">
                    <IconSymbol name="person.2.fill" size={16} color={BRAND.blue} />
                  </View>
                  <Text className="text-sm text-gray-700 font-medium">
                    {item.participants.length} participant{item.participants.length > 1 ? 's' : ''}
                  </Text>
                </>
              )}
            </View>
            {isParticipating && (
              <View className="flex-row items-center gap-1 bg-green-50 rounded-full px-2 py-1">
                <IconSymbol name="checkmark.circle.fill" size={12} color="#10B981" />
                <Text className="text-xs font-bold text-green-600">Inscrit</Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    );
  };


  const baseEvents = hasSearched ? searchResults : events;
  // Toujours par date (la recherche géolocalisée renvoie par distance) ; la distance reste affichée.
  const visibleEvents = [...baseEvents]
    .filter((e: any) => !thisWeek || new Date(e.hours).getTime() <= Date.now() + WEEK_MS)
    .sort((a: any, b: any) => new Date(a.hours).getTime() - new Date(b.hours).getTime());
  const isTextSearch = debouncedQuery.trim().length >= 3;

  if (status === 'loading' && events.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <LinearGradient
          colors={['#2345C2', '#3A5FE0', '#FFFFFF']}
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
        colors={['#2345C2', '#3A5FE0', '#FFFFFF']}
        locations={[0, 0.4, 0.8]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-white text-3xl font-bold flex-1">
              Découvrir
            </Text>
            <NotificationBell />
          </View>
          <Text className="text-white/90 text-base">
            Groupes et réunions d&apos;entrepreneurs autour de vous
          </Text>
        </View>

        {/* Bannière invitation à se connecter (visiteurs non connectés) */}
        {!user && (
          <View className="px-6 pb-4">
            <Pressable
              className="bg-white/15 rounded-2xl px-4 py-3 flex-row items-center justify-between active:opacity-70"
              onPress={() => router.push('/(auth)')}
            >
              <Text className="text-white font-medium flex-1 mr-3">
                Connectez-vous pour participer aux événements
              </Text>
              <Text className="text-white font-bold">Se connecter</Text>
            </Pressable>
          </View>
        )}

        {/* Recherche et filtres rapides */}
        <View className="px-6 pb-3">
          <View
            className="bg-white rounded-2xl flex-row items-center px-4 py-3"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color={BRAND.blue} />
            ) : (
              <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
            )}
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Réunion, groupe, ville..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-base text-gray-900"
              returnKeyType="search"
            />
            {(searchQuery || hasSearched) && (
              <Pressable onPress={handleResetSearch} className="ml-2" accessibilityLabel="Effacer la recherche">
                <IconSymbol name="xmark.circle.fill" size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2 px-6 pb-3">
          <Chip
            label="Près de moi"
            icon="location.fill"
            active={useGeolocation}
            onPress={() => handleGeolocationToggle(!useGeolocation)}
          />
          <Chip label="Cette semaine" icon="calendar" active={thisWeek} onPress={() => setThisWeek((v) => !v)} />
          {useGeolocation && (
            <Chip
              label={`${radius} km`}
              icon="slider.horizontal.3"
              active={showFilters}
              onPress={() => setShowFilters((v) => !v)}
            />
          )}
        </View>
        {useGeolocation && showFilters && (
          <View className="mx-6 mb-2 bg-white rounded-2xl px-4 py-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm font-medium text-gray-700">Rayon de recherche</Text>
              <Text className="text-sm font-bold text-brand-600">{radius} km</Text>
            </View>
            <Slider
              value={radius}
              onValueChange={(v) => setRadius(Math.round(v))}
              minimumValue={1}
              maximumValue={100}
              step={1}
              minimumTrackTintColor={BRAND.blue}
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor={BRAND.blue}
            />
          </View>
        )}

        {/* Liste des événements */}
        <FlatList
          data={visibleEvents}
          ListHeaderComponent={
            <View>
              {!isTextSearch && nearbyGroups.length > 0 && (
                <View className="mb-5">
                  <Text className="text-lg font-bold text-gray-900 mb-3">
                    {userLocation ? 'Groupes près de chez vous' : 'Groupes actifs'}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -20 }}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 6 }}
                  >
                    {nearbyGroups.map((g) => (
                      <GroupDiscoverCard key={g.id} group={g} />
                    ))}
                  </ScrollView>
                </View>
              )}
              <Text className="text-lg font-bold text-gray-900 mb-3">
                {isTextSearch ? 'Résultats' : useGeolocation ? `Prochains événements à moins de ${radius} km` : 'Prochains événements'}
              </Text>
            </View>
          }
          renderItem={renderEvent}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 }}
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
                Aucun événement trouvé
              </Text>
              <Text className="text-gray-500 text-center px-8">
                {hasSearched
                  ? 'Aucun événement ne correspond à votre recherche'
                  : 'Il n\'y a pas d\'événements disponibles pour le moment'
                }
              </Text>
            </View>
          }
        />

        {/* Floating Action Button */}
        <Pressable
          className="absolute bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl active:opacity-80"
          onPress={() => router.push('/(tabs)/(trouver)/create')}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={['#2345C2', '#3A5FE0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}
          >
            <IconSymbol name="plus" size={32} color="#fff" />
          </LinearGradient>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function Chip({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2 active:opacity-80"
      style={{
        backgroundColor: active ? BRAND.blue : '#FFFFFF',
        borderWidth: 1,
        borderColor: active ? BRAND.blue : '#E2E8F0',
      }}
    >
      <IconSymbol name={icon as any} size={14} color={active ? '#FFFFFF' : BRAND.blue} />
      <Text style={{ color: active ? '#FFFFFF' : '#1F2937' }} className="text-sm font-semibold">
        {label}
      </Text>
    </Pressable>
  );
}
