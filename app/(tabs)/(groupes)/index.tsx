import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, Dimensions, SafeAreaView, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchMyGroupsThunk } from '@/store/thunks/groupsThunks';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService } from '@/services/apiService';

type TabType = 'member' | 'creator';

const { width } = Dimensions.get('window');

export default function GroupesScreen() {
  const dispatch = useAppDispatch();
  const { myGroups, status } = useAppSelector((state) => state.groups);
  const { user, status: authStatus } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('member');
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const hasSetDefaultTab = useRef(false);

  useEffect(() => {
    if (user && authStatus === 'authenticated') {
      dispatch(fetchMyGroupsThunk());
      apiService.invitations.getMine()
        .then((res) => setPendingInvitations(res.data?.length || 0))
        .catch(() => {});
    }
  }, [user, authStatus]);

  // Par défaut, on arrive directement sur l'onglet le plus pertinent : Créateur
  // si on a créé au moins un groupe, Membre sinon — évite un clic inutile.
  // Ne s'applique qu'une fois au premier chargement, pas si l'utilisateur a
  // déjà choisi un onglet lui-même.
  useEffect(() => {
    if (!hasSetDefaultTab.current && myGroups.length > 0 && user) {
      const isCreatorOfSomething = myGroups.some((g) => g.groupcreator === user.id);
      setActiveTab(isCreatorOfSomething ? 'creator' : 'member');
      hasSetDefaultTab.current = true;
    }
  }, [myGroups, user]);

  const onRefresh = async () => {
    if (!user || authStatus !== 'authenticated') return;
    setRefreshing(true);
    await dispatch(fetchMyGroupsThunk());
    try {
      const res = await apiService.invitations.getMine();
      setPendingInvitations(res.data?.length || 0);
    } catch {}
    setRefreshing(false);
  };

  // Filter groups based on active tab
  const memberGroups = myGroups.filter(group => group.groupcreator !== user?.id);
  const createdGroups = myGroups.filter(group => group.groupcreator === user?.id);
  const currentGroups = activeTab === 'member' ? memberGroups : createdGroups;

  const renderGroup = ({ item }: any) => (
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
        onPress={() => router.push(`/(tabs)/(groupes)/${item.id}`)}
      >
        <View className="flex-row items-center gap-3 mb-3">
          {item.images?.[0] ? (
            <Image source={{ uri: item.images[0] }} style={{ width: 44, height: 44, borderRadius: 12 }} />
          ) : (
            <View className="bg-gray-100 rounded-xl items-center justify-center" style={{ width: 44, height: 44 }}>
              <IconSymbol name="person.3.fill" size={20} color="#9CA3AF" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">
              {item.name}
            </Text>
            {item.slogan && (
              <Text className="text-sm text-gray-600 italic" numberOfLines={1}>
                "{item.slogan}"
              </Text>
            )}
          </View>
        </View>

        <View className="flex-row items-center gap-2 mb-3">
          <View className="bg-gray-50 rounded-full p-1.5">
            <IconSymbol name="location.fill" size={16} color="#6B7280" />
          </View>
          <Text className="text-sm text-gray-600">
            {item.city}, {item.country}
          </Text>
        </View>

        <View className="flex-row items-center gap-4">
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

      {/* Action buttons for created groups */}
      {activeTab === 'creator' && (
        <View className="flex-row gap-2 mt-4 pt-4 border-t border-gray-100">
          <Pressable
            className="flex-1 py-3 px-4 rounded-xl bg-blue-50 active:bg-blue-100 flex-row items-center justify-center gap-2"
            onPress={() => router.push(`/(tabs)/(groupes)/${item.id}/edit` as any)}
          >
            <IconSymbol name="pencil" size={18} color="#3B82F6" />
            <Text className="text-blue-600 font-semibold">Modifier</Text>
          </Pressable>
          <Pressable
            className="flex-1 py-3 px-4 rounded-xl bg-red-50 active:bg-red-100 flex-row items-center justify-center gap-2"
            onPress={() => {
              // TODO: Add delete confirmation
              console.log('Delete group', item.id);
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

  if (status === 'loading' && myGroups.length === 0) {
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
              <Text className="text-white font-medium mt-4">Chargement de vos groupes...</Text>
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
        <View className="px-6 pt-4 pb-4">
          <Text className="text-white text-3xl font-bold mb-4">
            Mes groupes
          </Text>

          {/* Tabs */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => { hasSetDefaultTab.current = true; setActiveTab('member'); }}
              className={`flex-1 py-3 px-4 rounded-xl ${
                activeTab === 'member' ? 'bg-white' : 'bg-white/20'
              }`}
            >
              <Text className={`text-center font-bold ${
                activeTab === 'member' ? 'text-green-600' : 'text-white'
              }`}>
                Membre
              </Text>
              <Text className={`text-center text-sm mt-1 ${
                activeTab === 'member' ? 'text-green-500' : 'text-white/80'
              }`}>
                {memberGroups.length}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => { hasSetDefaultTab.current = true; setActiveTab('creator'); }}
              className={`flex-1 py-3 px-4 rounded-xl ${
                activeTab === 'creator' ? 'bg-white' : 'bg-white/20'
              }`}
            >
              <Text className={`text-center font-bold ${
                activeTab === 'creator' ? 'text-green-600' : 'text-white'
              }`}>
                Créateur
              </Text>
              <Text className={`text-center text-sm mt-1 ${
                activeTab === 'creator' ? 'text-green-500' : 'text-white/80'
              }`}>
                {createdGroups.length}
              </Text>
            </Pressable>
          </View>
        </View>

        {pendingInvitations > 0 && (
          <View className="px-6 pb-4">
            <Pressable
              onPress={() => router.push('/(tabs)/(groupes)/invitations' as any)}
              className="bg-white/15 rounded-2xl px-4 py-3 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="bg-white/20 rounded-full p-2">
                  <IconSymbol name="person.badge.plus" size={18} color="#fff" />
                </View>
                <Text className="text-white font-semibold flex-1">
                  {pendingInvitations} invitation{pendingInvitations > 1 ? 's' : ''} en attente
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-white font-bold">Voir</Text>
                <IconSymbol name="chevron.right" size={16} color="#fff" />
              </View>
            </Pressable>
          </View>
        )}

        {currentGroups.length === 0 ? (
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
                {activeTab === 'member' ? 'Aucun groupe rejoint' : 'Aucun groupe créé'}
              </Text>
              <Text className="text-gray-600 text-center mb-6 leading-6">
                {activeTab === 'member'
                  ? 'Vous ne faites partie d\'aucun groupe. Ces groupes fonctionnent uniquement sur invitation : demandez à un membre de vous inviter !'
                  : 'Vous n\'avez créé aucun groupe. Créez-en un pour rassembler votre communauté !'}
              </Text>
              <Pressable
                className="py-4 px-8 rounded-2xl w-full active:opacity-80"
                onPress={() => router.push(activeTab === 'member' ? '/(tabs)/(groupes)/invitations' as any : '/(tabs)/(groupes)/create' as any)}
              >
                <LinearGradient
                  colors={['#10B981', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                />
                <Text className="text-white text-center font-bold text-lg relative z-10">
                  {activeTab === 'member' ? 'Voir mes invitations' : 'Créer un groupe'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <FlatList
            data={currentGroups}
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
