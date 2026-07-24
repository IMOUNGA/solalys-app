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
  const { currentEvent, status } = useAppSelector((state) => state.events);

  useEffect(() => {
    if (id && !isNaN(Number(id))) {
      dispatch(fetchEventByIdThunk(Number(id)));
    }
  }, [id]);

  const participants = currentEvent?.participants || [];

  const renderParticipant = ({ item }: { item: EventParticipant }) => {
    const name = item.user ? `${item.user.firstname} ${item.user.lastname}` : 'Utilisateur';
    const isOrganizer = currentEvent?.userId === item.userId;
    const metier = item.user?.metier?.trim();
    const groupName = item.user?.primaryGroup?.name;

    return (
      <View className="flex-row items-center gap-3 px-5 py-3">
        <Avatar name={name} size={44} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 dark:text-white">
            {name}
          </Text>
          {(metier || groupName) && (
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {[metier, groupName].filter(Boolean).join(' · ')}
            </Text>
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
          Participants {participants.length > 0 ? `(${participants.length})` : ''}
        </Text>
      </View>

      {status === 'loading' && participants.length === 0 ? (
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
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base text-gray-400 dark:text-gray-500 text-center">
            Personne ne participe pour l'instant. Soyez le premier !
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
