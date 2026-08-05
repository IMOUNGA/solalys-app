import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, SafeAreaView, TextInput, Switch, Alert, Image } from 'react-native';
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
          console.log('📍 Position actuelle:', coords);
          setUserLocation(coords);
        } else {
          console.log('⚠️ Permission géolocalisation non accordée');
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

  // Recherche
  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const response = await apiService.events.search(
        searchQuery.trim() || undefined,
        useGeolocation ? userLocation?.latitude : undefined,
        useGeolocation ? userLocation?.longitude : undefined,
        radius,
        1,
        50
      );

      setSearchResults(response.data.data || []);
      setHasSearched(true);
      setShowFilters(false);
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert('Erreur', 'Impossible de rechercher les événements.');
    } finally {
      setIsSearching(false);
    }
  }, [user, authStatus, searchQuery, useGeolocation, userLocation, radius]);

  // Reset recherche
  const handleResetSearch = () => {
    setSearchQuery('');
    setUseGeolocation(false);
    setUserLocation(null);
    setSearchResults([]);
    setShowFilters(false);
    setHasSearched(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    handleResetSearch();
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

  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const renderEvent = ({ item }: any) => {
    // Calculer la distance si la géolocalisation est activée
    let distance: number | null = null;
    if (userLocation && item.latitude && item.longitude) {
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude,
        item.longitude
      );
    } else {
      // Debug: vérifier pourquoi la distance n'est pas calculée
      if (!userLocation) {
        console.log('⚠️ userLocation non disponible');
      }
      if (!item.latitude || !item.longitude) {
        console.log(`⚠️ Event ${item.id} sans coordonnées (lat: ${item.latitude}, lng: ${item.longitude})`);
      }
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
              <Text className="text-xs text-violet-600 font-semibold mt-0.5 mb-1">
                {item.group.name}
              </Text>
            )}
            {item.description && (
              <Text className="text-sm text-gray-600 mb-2 leading-5">
                {truncateDescription(item.description)}
              </Text>
            )}
            <View className="flex-row items-center gap-2">
              <View className="bg-blue-50 rounded-full p-1.5">
                <IconSymbol name="calendar" size={16} color="#3B82F6" />
              </View>
              <Text className="text-sm text-gray-600 font-medium">
                {formatDate(item.hours)}
              </Text>
            </View>
          </View>

          {/* Image à droite, compacte pour laisser la place au titre */}
          {hasImage && (
            <Image
              source={{ uri: item.images[0] }}
              style={{ width: 56, height: 56 }}
              className="rounded-xl"
              resizeMode="cover"
            />
          )}
        </View>

        <View className="flex-row items-center gap-2 mb-3">
          <View className="bg-gray-50 rounded-full p-1.5">
            <IconSymbol name="location.fill" size={16} color="#6B7280" />
          </View>
          <View className="flex-1 flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">
              {item.city}, {item.country}
            </Text>
            {distance !== null && (
              <View className="bg-blue-50 px-2 py-1 rounded-full">
                <Text className="text-xs font-bold text-blue-600">
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
                  <View className="bg-green-50 rounded-full p-1.5">
                    <IconSymbol name="person.2.fill" size={16} color="#10B981" />
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
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-white text-3xl font-bold flex-1">
              Événements
            </Text>
            <NotificationBell />
          </View>
          <Text className="text-white/90 text-base">
            Découvrez les événements près de chez vous
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

        {/* Search Bar */}
        <View className="px-6 pb-4">
          <View className="bg-white/95 rounded-2xl overflow-hidden" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
            {/* Input recherche */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
              {isSearching ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
              )}
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Tapez au moins 3 lettres pour rechercher..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-base text-gray-900"
              />
              {(searchQuery || searchResults.length > 0) && (
                <Pressable onPress={handleResetSearch} className="ml-2">
                  <IconSymbol name="xmark.circle.fill" size={20} color="#9CA3AF" />
                </Pressable>
              )}
            </View>

            {/* Filtres */}
            <View className="px-4 py-3">
              <Pressable
                onPress={() => setShowFilters(!showFilters)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="line.3.horizontal.decrease.circle" size={20} color="#3B82F6" />
                  <Text className="text-sm font-semibold text-gray-700">
                    Filtres {useGeolocation && `(${radius}km)`}
                  </Text>
                </View>
                <IconSymbol name={showFilters ? "chevron.up" : "chevron.down"} size={16} color="#6B7280" />
              </Pressable>

              {showFilters && (
                <View className="mt-4 pt-4 border-t border-gray-100">
                  {/* Toggle autour de moi */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-2">
                      <IconSymbol name="location.fill" size={18} color="#10B981" />
                      <Text className="text-sm font-medium text-gray-700">
                        Autour de moi
                      </Text>
                    </View>
                    <Switch
                      value={useGeolocation}
                      onValueChange={handleGeolocationToggle}
                      trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                      thumbColor="#fff"
                    />
                  </View>

                  {/* Slider rayon */}
                  {useGeolocation && (
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-medium text-gray-700">
                          Rayon de recherche
                        </Text>
                        <Text className="text-sm font-bold text-blue-600">
                          {radius} km
                        </Text>
                      </View>
                      <Slider
                        value={radius}
                        onValueChange={setRadius}
                        minimumValue={1}
                        maximumValue={100}
                        step={1}
                        minimumTrackTintColor="#3B82F6"
                        maximumTrackTintColor="#D1D5DB"
                        thumbTintColor="#3B82F6"
                      />
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-gray-400">1 km</Text>
                        <Text className="text-xs text-gray-400">100 km</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Bouton Rechercher */}
              <Pressable
                onPress={handleSearch}
                disabled={isSearching}
                className={`mt-3 py-3 px-4 rounded-xl ${isSearching ? 'opacity-50' : 'active:opacity-80'}`}
              >
                <LinearGradient
                  colors={isSearching ? ['#9CA3AF', '#9CA3AF'] : ['#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12 }}
                />
                <View className="flex-row items-center justify-center gap-2">
                  {isSearching ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text className="text-white font-semibold">Recherche...</Text>
                    </>
                  ) : (
                    <>
                      <IconSymbol name="magnifyingglass" size={16} color="#fff" />
                      <Text className="text-white font-semibold">Rechercher</Text>
                    </>
                  )}
                </View>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Liste des événements */}
        <FlatList
          data={hasSearched ? searchResults : events}
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
            colors={['#3B82F6', '#8B5CF6']}
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
