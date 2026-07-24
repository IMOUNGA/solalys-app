import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchGroupByIdThunk, leaveGroupThunk } from '@/store/thunks/groupsThunks';
import { clearCurrentGroup } from '@/store/slices/groupsSlice';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';

const MAX_STACKED_AVATARS = 5;

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { currentGroup, status } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const [isMember, setIsMember] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  useEffect(() => {
    if (id && !isNaN(Number(id))) {
      dispatch(fetchGroupByIdThunk(Number(id)));
    }
    return () => {
      dispatch(clearCurrentGroup());
    };
  }, [id]);

  useEffect(() => {
    if (currentGroup && user) {
      const member = currentGroup.groupMemberships?.some(
        (m) => m.userId === user.id
      );
      setIsMember(member || false);
    }
  }, [currentGroup, user]);

  const handleLeave = async () => {
    if (!currentGroup) return;

    setIsLeaving(true);
    try {
      await dispatch(leaveGroupThunk(currentGroup.id)).unwrap();
      showSuccess('Vous avez quitté le groupe');
      await dispatch(fetchGroupByIdThunk(currentGroup.id));
    } catch (error: any) {
      showError(error.message || 'Une erreur est survenue');
    } finally {
      setIsLeaving(false);
    }
  };

  if (status === 'failed' && !currentGroup) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
        <View className="flex-1 items-center justify-center px-8">
          <IconSymbol name="exclamationmark.triangle.fill" size={40} color="#EF4444" />
          <Text className="text-gray-900 dark:text-white font-semibold text-lg mt-4 mb-1 text-center">
            Impossible de charger ce groupe
          </Text>
          <Pressable
            onPress={() => dispatch(fetchGroupByIdThunk(Number(id)))}
            className="mt-4 px-6 py-3 rounded-xl bg-violet-500 active:opacity-80"
          >
            <Text className="text-white font-semibold">Réessayer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'loading' && !currentGroup) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-gray-500 dark:text-gray-400 mt-4">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentGroup) {
    return null;
  }

  const memberships = currentGroup.groupMemberships || [];
  const stackedMembers = memberships.slice(0, MAX_STACKED_AVATARS);
  const overflowCount = memberships.length - stackedMembers.length;
  const isCreator = user ? currentGroup.groupcreator === user.id : false;
  const canInvite = isMember || isCreator;
  const upcomingEvents = (currentGroup.events || [])
    .filter((e) => new Date(e.hours).getTime() >= Date.now())
    .sort((a, b) => new Date(a.hours).getTime() - new Date(b.hours).getTime());

  const formatShortDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} bounces={false}>
        {/* Hero */}
        <View style={{ height: 180 }}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <View className="bg-white/15 rounded-full p-6">
              <IconSymbol name="person.2.fill" size={40} color="#fff" />
            </View>
          </LinearGradient>

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
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {currentGroup.name}
          </Text>

          {currentGroup.slogan && (
            <Text className="text-base text-gray-500 dark:text-gray-400 italic mb-4">
              "{currentGroup.slogan}"
            </Text>
          )}

          {/* Chips résumé */}
          <View className="flex-row flex-wrap gap-2 mb-6">
            <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-900 rounded-full px-3 py-1.5">
              <IconSymbol name="location.fill" size={14} color="#EF4444" />
              <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {currentGroup.city}, {currentGroup.country}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-900 rounded-full px-3 py-1.5">
              <IconSymbol name="person.2.fill" size={14} color="#8B5CF6" />
              <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {memberships.length} membre{memberships.length > 1 ? 's' : ''}
              </Text>
            </View>
            {currentGroup.events && currentGroup.events.length > 0 && (
              <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-900 rounded-full px-3 py-1.5">
                <IconSymbol name="calendar" size={14} color="#3B82F6" />
                <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {currentGroup.events.length} événement{currentGroup.events.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Annuaire — réservé aux membres */}
          {canInvite && (
            <Pressable
              onPress={() => router.push(`/(tabs)/(groupes)/${currentGroup.id}/annuaire` as any)}
              className="active:opacity-80 mb-3"
            >
              <LinearGradient
                colors={['#EEF2FF', '#FCE7F3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-white rounded-full p-2.5">
                    <IconSymbol name="book.fill" size={20} color="#8B5CF6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-900">
                      Annuaire des membres
                    </Text>
                    <Text className="text-xs text-gray-600 mt-0.5">
                      Métiers, offres et recherches de chacun
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={18} color="#8B5CF6" />
                </View>
              </LinearGradient>
            </Pressable>
          )}

          {/* Board d'opportunités — réservé aux membres */}
          {canInvite && (
            <Pressable
              onPress={() => router.push(`/(tabs)/(groupes)/${currentGroup.id}/opportunites` as any)}
              className="active:opacity-70 mb-3 flex-row items-center gap-3 bg-amber-50 dark:bg-amber-950 rounded-2xl p-4"
            >
              <View className="bg-white dark:bg-gray-800 rounded-full p-2.5">
                <IconSymbol name="lightbulb.fill" size={20} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900 dark:text-white">
                  Board d'opportunités
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Prestataires, partenariats, recrutements...
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color="#D97706" />
            </Pressable>
          )}

          {/* Recommandations & CA — réservé aux membres */}
          {canInvite && (
            <Pressable
              onPress={() => router.push(`/(tabs)/(groupes)/${currentGroup.id}/referrals` as any)}
              className="active:opacity-70 mb-3 flex-row items-center gap-3 bg-green-50 dark:bg-green-950 rounded-2xl p-4"
            >
              <View className="bg-white dark:bg-gray-800 rounded-full p-2.5">
                <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900 dark:text-white">
                  Recommandations & CA
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Recommander un membre, suivre vos affaires
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color="#10B981" />
            </Pressable>
          )}

          {/* Gouvernance — réservé aux membres */}
          {canInvite && (
            <Pressable
              onPress={() => router.push(`/(tabs)/(groupes)/${currentGroup.id}/gouvernance` as any)}
              className="active:opacity-70 mb-3 flex-row items-center gap-3 bg-blue-50 dark:bg-blue-950 rounded-2xl p-4"
            >
              <View className="bg-white dark:bg-gray-800 rounded-full p-2.5">
                <IconSymbol name="crown.fill" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900 dark:text-white">
                  Gouvernance
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Rôles du groupe et CA généré
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color="#3B82F6" />
            </Pressable>
          )}

          {/* Inviter un membre — visible uniquement des membres */}
          {canInvite && (
            <Pressable
              onPress={() => router.push(`/(tabs)/(groupes)/${currentGroup.id}/inviter` as any)}
              className="active:opacity-70 mb-6 flex-row items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl p-4"
            >
              <View className="bg-white dark:bg-gray-800 rounded-full p-2.5">
                <IconSymbol name="person.badge.plus" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900 dark:text-white">
                  Inviter un membre
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Ce groupe fonctionne uniquement sur invitation
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </Pressable>
          )}

          <View className="border-t border-gray-100 dark:border-gray-800 mb-6" />

          {/* Créateur */}
          {currentGroup.creator && (
            <View className="mb-6">
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">Créé par</Text>
              <View className="flex-row items-center gap-3">
                <Avatar
                  name={`${currentGroup.creator.firstname} ${currentGroup.creator.lastname}`}
                  size={44}
                />
                <Text className="text-base text-gray-900 dark:text-white font-semibold">
                  {currentGroup.creator.firstname} {currentGroup.creator.lastname}
                </Text>
              </View>
            </View>
          )}

          {/* Prochains événements — visible de tous, membre ou non */}
          {upcomingEvents.length > 0 && (
            <View className="mb-6">
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Prochains événements
              </Text>
              <View className="gap-2">
                {upcomingEvents.map((event) => (
                  <Pressable
                    key={event.id}
                    onPress={() => router.push(`/(tabs)/(trouver)/${event.id}` as any)}
                    className="flex-row items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl p-3 active:opacity-70"
                  >
                    <View className="bg-white dark:bg-gray-800 rounded-full p-2">
                      <IconSymbol name="calendar" size={16} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                        {event.name}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                        {formatShortDate(event.hours)}
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Membres — réservé aux membres */}
          {canInvite && memberships.length > 0 && (
            <Pressable
              onPress={() => router.push(`/(tabs)/(groupes)/${currentGroup.id}/annuaire` as any)}
              className="active:opacity-70"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  Membres ({memberships.length})
                </Text>
                <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
              </View>
              <View className="flex-row items-center">
                {stackedMembers.map((m, index) => (
                  <View
                    key={m.id}
                    style={{ marginLeft: index === 0 ? 0 : -12, zIndex: stackedMembers.length - index }}
                  >
                    <Avatar
                      name={m.user ? `${m.user.firstname} ${m.user.lastname}` : '?'}
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
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Bas de page : statut d'adhésion */}
      <SafeAreaView className="bg-white dark:bg-gray-950">
      <View className="p-5 pt-3 border-t border-gray-100 dark:border-gray-800">
        {!user ? (
          <Pressable
            onPress={() => router.push('/(auth)')}
            className="rounded-2xl overflow-hidden active:opacity-90"
          >
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, paddingHorizontal: 24 }}
            >
              <Text className="text-white text-center font-bold text-lg">
                Se connecter pour rejoindre
              </Text>
            </LinearGradient>
          </Pressable>
        ) : isCreator ? (
          <View className="py-4 px-6 rounded-2xl bg-gray-100 dark:bg-gray-900">
            <Text className="text-gray-500 dark:text-gray-400 text-center font-bold text-lg">
              Vous êtes le créateur
            </Text>
          </View>
        ) : isMember ? (
          <Pressable
            onPress={handleLeave}
            disabled={isLeaving}
            className={`rounded-2xl overflow-hidden ${isLeaving ? 'opacity-60' : 'active:opacity-90'}`}
          >
            <View className="py-4 px-6 bg-red-500">
              <Text className="text-white text-center font-bold text-lg">
                {isLeaving ? 'Chargement...' : 'Quitter le groupe'}
              </Text>
            </View>
          </Pressable>
        ) : (
          <View className="py-4 px-6 rounded-2xl bg-gray-50 dark:bg-gray-900 flex-row items-center gap-3">
            <IconSymbol name="lock.fill" size={18} color="#9CA3AF" />
            <Text className="flex-1 text-sm text-gray-500 dark:text-gray-400">
              Ce groupe fonctionne sur invitation. Demandez à un membre de vous inviter pour le rejoindre.
            </Text>
          </View>
        )}
      </View>
      </SafeAreaView>
    </View>
  );
}
