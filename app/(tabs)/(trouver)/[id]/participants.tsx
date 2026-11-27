import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchEventByIdThunk } from '@/store/thunks/eventsThunks';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import type { EventParticipant } from '@/types/event';

export default function EventParticipantsScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { currentEvent: storedEvent, status } = useAppSelector((state) => state.events);
  // Ne pas afficher les participants d'un autre événement resté dans le store.
  const currentEvent = storedEvent && storedEvent.id === Number(id) ? storedEvent : null;

  useEffect(() => {
    if (id && !isNaN(Number(id))) {
      dispatch(fetchEventByIdThunk(Number(id)));
    }
  }, [id]);

  const allParticipants = currentEvent?.participants || [];
  // Les noms ne sont transmis qu'aux membres du groupe et aux participants :
  // pour les autres, on n'affiche que le nombre.
  const participants = allParticipants.filter((p) => p.user);
  const hiddenCount = allParticipants.length - participants.length;

  const renderParticipant = ({ item }: { item: EventParticipant }) => {
    const name = item.user ? `${item.user.firstname} ${item.user.lastname}` : 'Utilisateur';
    const isOrganizer = !!item.userId && currentEvent?.userId === item.userId;
    const metier = item.user?.metier?.trim();

    return (
      <View className="flex-row items-center gap-3 px-5 py-3">
        <Avatar name={name} uri={item.user?.avatar} size={44} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 dark:text-white">
            {name}
          </Text>
          {metier && (
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{metier}</Text>
          )}
          {isOrganizer && (
            <Text className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
              Organisateur
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center -ml-2"
        >
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">
          Participants {allParticipants.length > 0 ? `(${allParticipants.length})` : ''}
        </Text>
      </View>

      {status === 'loading' && allParticipants.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : participants.length > 0 ? (
        <FlatList
          data={participants}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderParticipant}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-gray-100 dark:bg-gray-800 ml-[72px]" />
          )}
        />
      ) : hiddenCount > 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center">
            {hiddenCount} participant{hiddenCount > 1 ? 's' : ''}. Les noms sont visibles uniquement par les membres du groupe et les participants.
          </Text>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base text-gray-400 dark:text-gray-500 text-center">
            {"Personne ne participe pour l'instant. Soyez le premier !"}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
