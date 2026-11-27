import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, SafeAreaView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchGroupByIdThunk, leaveGroupThunk } from '@/store/thunks/groupsThunks';
import { clearCurrentGroup } from '@/store/slices/groupsSlice';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/ui/BackButton';
import { useSuccessAlert, useErrorAlert, useConfirmAlert } from '@/hooks/useAlert';
import { GroupHighlights } from '@/components/group/GroupHighlights';
import { GroupCover } from '@/components/group/GroupCover';
import { BRAND } from '@/lib/brand';
import { weeklyRhythm } from '@/lib/rhythm';

const MAX_STACKED_AVATARS = 6;

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { currentGroup, status } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const [isMember, setIsMember] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();
  const showConfirm = useConfirmAlert();

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
      const member = currentGroup.isMember ?? currentGroup.groupMemberships?.some(
        (m) => m.userId === user.id
      );
      setIsMember(member || false);
    }
  }, [currentGroup, user]);

  const handleLeave = () => {
    if (!currentGroup) return;
    showConfirm(
      `Vous ne verrez plus les réunions, l'annuaire ni les recommandations de ${currentGroup.name}. Pour revenir, il faudra une nouvelle invitation.`,
      async () => {
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
      },
      'Quitter le groupe ?',
      'Quitter',
    );
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
            className="mt-4 px-6 py-3 rounded-xl bg-brand active:opacity-80"
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
          <ActivityIndicator size="large" color="#2345C2" />
          <Text className="text-gray-500 dark:text-gray-400 mt-4">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentGroup) {
    return null;
  }

  const memberships = currentGroup.groupMemberships || [];
  // Les non-membres ne reçoivent pas la liste des membres, seulement leur nombre.
  const memberCount = currentGroup.memberCount ?? memberships.length;
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

  const nextMeeting = upcomingEvents[0];
  const otherEvents = upcomingEvents.slice(1, 4);
  const openEvent = (eventId: number) =>
    router.push({
      pathname: `/(tabs)/(trouver)/${eventId}` as any,
      params: { returnTo: `/(tabs)/(groupes)/${currentGroup.id}` },
    });
  const go = (path: string) => router.push(`/(tabs)/(groupes)/${currentGroup.id}/${path}` as any);

  // Outils du groupe (membres) : grille compacte plutôt qu'une carte par outil.
  const tools: { key: string; label: string; icon: string; path: string; show: boolean }[] = [
    { key: 'referrals', label: 'Recos et CA', icon: 'chart.line.uptrend.xyaxis', path: 'referrals', show: canInvite },
    { key: 'presence', label: 'Présence', icon: 'checkmark.circle.fill', path: 'presence', show: isMember },
    { key: 'ask', label: 'Ma demande', icon: 'bubble.left.and.bubble.right.fill', path: 'ask-hebdomadaire', show: canInvite },
    { key: 'opps', label: 'Opportunités', icon: 'lightbulb.fill', path: 'opportunites', show: canInvite },
    { key: 'guests', label: 'Invités', icon: 'person.crop.circle.badge.plus', path: 'invites', show: canInvite },
    { key: 'invite', label: 'Inviter', icon: 'person.badge.plus', path: 'inviter', show: canInvite },
    { key: 'gov', label: 'Gouvernance', icon: 'crown.fill', path: 'gouvernance', show: canInvite },
    { key: 'directory', label: 'Annuaire', icon: 'book.fill', path: 'annuaire', show: canInvite },
  ];
  const visibleTools = tools.filter((t) => t.show);

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} bounces={false}>
        {/* Couverture : photo du groupe, sinon bleu roi et initiales */}
        <View>
          <GroupCover name={currentGroup.name} image={currentGroup.images?.[0]} height={220} />
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
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {currentGroup.name}
          </Text>

          {currentGroup.slogan && (
            <Text className="text-base text-gray-500 dark:text-gray-400 italic mb-3">
              “{currentGroup.slogan}”
            </Text>
          )}

          {currentGroup.images && currentGroup.images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
              {currentGroup.images.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={{ width: 96, height: 72, borderRadius: 12 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          {/* Repères : ville, rythme des réunions, taille du groupe */}
          <View className="flex-row flex-wrap gap-2 mb-5">
            <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-900 rounded-full px-3 py-1.5">
              <IconSymbol name="location.fill" size={13} color="#6B7280" />
              <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {currentGroup.city}, {currentGroup.country}
              </Text>
            </View>
            {(currentGroup.meetings || []).map((m) => (
              <View
                key={`${m.dayOfWeek}-${m.startTime}`}
                style={{ backgroundColor: '#EEF2FF' }}
                className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
              >
                <IconSymbol name="arrow.triangle.2.circlepath" size={13} color={BRAND.blue} />
                <Text style={{ color: BRAND.blueText }} className="text-xs font-semibold">
                  {weeklyRhythm(m.dayOfWeek, m.startTime)}
                </Text>
              </View>
            ))}
            <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-gray-900 rounded-full px-3 py-1.5">
              <IconSymbol name="person.2.fill" size={13} color="#6B7280" />
              <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {memberCount} membre{memberCount > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Prochaine réunion */}
          {nextMeeting && (
            <Pressable
              onPress={() => openEvent(nextMeeting.id)}
              className="flex-row items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 mb-5 active:opacity-70"
            >
              <View style={{ backgroundColor: '#FFF6E0', width: 46 }} className="rounded-xl items-center py-1.5">
                <Text style={{ color: '#9A6A00' }} className="text-[10px] font-semibold uppercase">
                  {new Date(nextMeeting.hours).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                </Text>
                <Text style={{ color: '#7A5200' }} className="text-lg font-extrabold leading-5">
                  {new Date(nextMeeting.hours).getDate()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 dark:text-gray-400">Prochaine réunion</Text>
                <Text className="text-sm font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
                  {`${nextMeeting.name} · ${new Date(nextMeeting.hours).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                </Text>
              </View>
              <View style={{ backgroundColor: BRAND.blue }} className="rounded-xl px-3 py-2">
                <Text className="text-xs font-semibold text-white">Voir</Text>
              </View>
            </Pressable>
          )}

          <GroupHighlights stats={currentGroup.stats} memberCount={memberCount} />

          {/* Visages des membres — réservé aux membres */}
          {canInvite && memberships.length > 0 && (
            <Pressable onPress={() => go('annuaire')} className="flex-row items-center mb-5 active:opacity-70">
              <View className="flex-row items-center flex-1">
                {stackedMembers.map((m, index) => (
                  <View key={m.id} style={{ marginLeft: index === 0 ? 0 : -10, zIndex: stackedMembers.length - index }}>
                    <Avatar
                      name={m.user ? `${m.user.firstname} ${m.user.lastname}` : '?'}
                      size={36}
                      style={{ borderWidth: 2, borderColor: '#fff' }}
                    />
                  </View>
                ))}
                {overflowCount > 0 && (
                  <View
                    className="bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
                    style={{ width: 36, height: 36, marginLeft: -10, borderWidth: 2, borderColor: '#fff' }}
                  >
                    <Text className="text-xs font-bold text-gray-600 dark:text-gray-300">+{overflowCount}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: BRAND.blue }} className="text-sm font-semibold">
                Annuaire
              </Text>
              <IconSymbol name="chevron.right" size={14} color={BRAND.blue} />
            </Pressable>
          )}

          {/* Outils du groupe — réservé aux membres */}
          {visibleTools.length > 0 && (
            <View className="flex-row flex-wrap mb-4" style={{ marginHorizontal: -5 }}>
              {visibleTools.map((tool) => (
                <Pressable
                  key={tool.key}
                  onPress={() => go(tool.path)}
                  style={{ width: '25%', paddingHorizontal: 5 }}
                  className="items-center mb-4 active:opacity-60"
                >
                  <View
                    style={{ backgroundColor: BRAND.blueSoft, height: 54 }}
                    className="w-full rounded-2xl items-center justify-center dark:bg-gray-900"
                  >
                    <IconSymbol name={tool.icon as any} size={22} color={BRAND.blue} />
                  </View>
                  <Text className="text-[11px] text-gray-700 dark:text-gray-300 mt-1.5 text-center" numberOfLines={1}>
                    {tool.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Autres réunions à venir — visibles de tous */}
          {otherEvents.length > 0 && (
            <View className="mb-6">
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">Ensuite</Text>
              <View className="gap-2">
                {otherEvents.map((event) => (
                  <Pressable
                    key={event.id}
                    onPress={() => openEvent(event.id)}
                    className="flex-row items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl p-3 active:opacity-70"
                  >
                    <IconSymbol name="calendar" size={16} color={BRAND.blue} />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
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

          {/* Créateur */}
          {currentGroup.creator && (
            <View className="flex-row items-center gap-2 mt-2">
              <Avatar name={`${currentGroup.creator.firstname} ${currentGroup.creator.lastname}`} size={28} />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {`Créé par ${currentGroup.creator.firstname} ${currentGroup.creator.lastname}`}
              </Text>
            </View>
          )}

          {/* Quitter : action rare, volontairement discrète en fin de page */}
          {isMember && !isCreator && (
            <Pressable onPress={handleLeave} disabled={isLeaving} className="mt-8 py-3 items-center active:opacity-60">
              <Text className="text-sm font-semibold text-red-500">
                {isLeaving ? 'Un instant...' : 'Quitter le groupe'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Bas de page : seulement pour un visiteur (connexion ou adhésion sur invitation) */}
      {(!user || (!isMember && !isCreator)) && (
      <SafeAreaView className="bg-white dark:bg-gray-950">
      <View className="p-5 pt-3 border-t border-gray-100 dark:border-gray-800">
        {!user ? (
          <Pressable
            onPress={() => router.push('/(auth)')}
            className="rounded-2xl overflow-hidden active:opacity-90"
          >
            <View style={{ backgroundColor: BRAND.blue, paddingVertical: 16, paddingHorizontal: 24 }}>
              <Text className="text-white text-center font-bold text-lg">
                Se connecter pour rejoindre
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
      )}
    </View>
  );
}
