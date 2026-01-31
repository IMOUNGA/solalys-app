import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, Dimensions, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchGroupsThunk } from '@/store/thunks/groupsThunks';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

export default function GroupesScreen() {
  const dispatch = useAppDispatch();
  const { groups, status } = useAppSelector((state) => state.groups);
  const { user, status: authStatus } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user && authStatus === 'authenticated') {
      dispatch(fetchGroupsThunk({}));
    }
  }, [user, authStatus]);

  const onRefresh = async () => {
    if (!user || authStatus !== 'authenticated') return;
    setRefreshing(true);
    await dispatch(fetchGroupsThunk({}));
    setRefreshing(false);
  };

  const renderGroup = ({ item }: any) => (
    <Pressable
      className="bg-white p-5 mb-4 rounded-2xl active:opacity-70"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
      onPress={() => router.push(`/(tabs)/(groupes)/${item.id}`)}
    >
      <View className="mb-3">
        <Text className="text-lg font-bold text-gray-900 mb-2">
          {item.name}
        </Text>
        {item.slogan && (
          <Text className="text-sm text-gray-600 italic">
            "{item.slogan}"
          </Text>
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

      <View className="flex-row items-center gap-4 pt-3 border-t border-gray-100">
        {item.groupMemberships && item.groupMemberships.length > 0 && (
          <View className="flex-row items-center gap-2">
            <View className="bg-green-50 rounded-full p-1.5">
              <IconSymbol name="person.2.fill" size={16} color="#10B981" />
            </View>
            <Text className="text-sm text-gray-700 font-medium">
              {item.groupMemberships.length} membre{item.groupMemberships.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
        {item.events && item.events.length > 0 && (
          <View className="flex-row items-center gap-2">
            <View className="bg-blue-50 rounded-full p-1.5">
              <IconSymbol name="calendar" size={16} color="#3B82F6" />
            </View>
            <Text className="text-sm text-gray-700 font-medium">
              {item.events.length} événement{item.events.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  if (!user) {
    return (
      <View className="flex-1 bg-white">
        <LinearGradient
          colors={['#10B981', '#3B82F6', '#FFFFFF']}
          locations={[0, 0.5, 1]}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1">
            <View className="flex-1 items-center justify-center px-6">
              <View className="bg-white/20 backdrop-blur-xl rounded-full p-6 mb-6">
                <IconSymbol name="person.3.fill" size={64} color="#fff" />
              </View>
              <Text className="text-white text-2xl font-bold text-center mb-3">
                Rejoignez des groupes
              </Text>
              <Text className="text-white/90 text-center text-base mb-8 leading-6">
                Connectez-vous pour découvrir des groupes qui partagent vos passions
              </Text>
              <Pressable
                className="px-8 py-4 rounded-2xl active:opacity-80"
                onPress={() => router.push('/(auth)')}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F3F4F6']}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                />
                <Text className="text-green-600 font-bold text-lg relative z-10">
                  Se connecter
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (status === 'loading' && groups.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <LinearGradient
          colors={['#10B981', '#3B82F6', '#FFFFFF']}
          locations={[0, 0.3, 0.7]}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1">
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#fff" />
              <Text className="text-white font-medium mt-4">Chargement des groupes...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={['#10B981', '#3B82F6', '#FFFFFF']}
        locations={[0, 0.4, 0.8]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-white text-3xl font-bold mb-2">
            Groupes
          </Text>
          <Text className="text-white/90 text-base">
            {groups.length} groupe{groups.length > 1 ? 's' : ''} disponible{groups.length > 1 ? 's' : ''}
          </Text>
        </View>

        {groups.length === 0 ? (
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
              <View className="bg-green-100 rounded-full p-6 mb-4">
                <IconSymbol name="person.3.fill" size={56} color="#10B981" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                Aucun groupe disponible
              </Text>
              <Text className="text-gray-600 text-center leading-6">
                Il n'y a pas encore de groupes. Revenez bientôt !
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroup}
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
