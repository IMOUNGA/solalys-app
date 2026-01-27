import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchGroupByIdThunk, joinGroupThunk, leaveGroupThunk } from '@/store/thunks/groupsThunks';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { currentGroup, status } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  useEffect(() => {
    if (id && !isNaN(Number(id))) {
      dispatch(fetchGroupByIdThunk(Number(id)));
    }
  }, [id]);

  useEffect(() => {
    if (currentGroup && user) {
      const member = currentGroup.groupMemberships?.some(
        (m) => m.userId === user.id
      );
      setIsMember(member || false);
    }
  }, [currentGroup, user]);

  const handleJoinLeave = async () => {
    if (!currentGroup || !user) return;

    setIsJoining(true);
    try {
      if (isMember) {
        await dispatch(leaveGroupThunk(currentGroup.id)).unwrap();
        showSuccess('Vous avez quitté le groupe');
      } else {
        await dispatch(joinGroupThunk(currentGroup.id)).unwrap();
        showSuccess('Vous avez rejoint le groupe !');
      }
      // Refresh group
      await dispatch(fetchGroupByIdThunk(currentGroup.id));
    } catch (error: any) {
      showError(error.message || 'Une erreur est survenue');
    } finally {
      setIsJoining(false);
    }
  };

  if (status === 'loading' || !currentGroup) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-gray-500 mt-4">Chargement...</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="p-5 pb-6 border-b border-gray-200 dark:border-gray-800">
          <Pressable onPress={() => router.back()} className="mb-4">
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </Pressable>

          <ThemedText type="title" className="mb-2">
            {currentGroup.name}
          </ThemedText>

          {currentGroup.slogan && (
            <Text className="text-gray-600 dark:text-gray-400 italic text-base">
              "{currentGroup.slogan}"
            </Text>
          )}
        </View>

        {/* Info */}
        <View className="p-5 space-y-4">
          {/* Location */}
          <View className="flex-row items-start gap-3">
            <IconSymbol name="location.fill" size={20} color="#EF4444" />
            <View className="flex-1">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Localisation</Text>
              <Text className="text-base text-gray-900 dark:text-white font-medium">
                {currentGroup.adresse || `${currentGroup.city}, ${currentGroup.country}`}
              </Text>
            </View>
          </View>

          {/* Creator */}
          {currentGroup.creator && (
            <View className="flex-row items-start gap-3">
              <IconSymbol name="person.fill" size={20} color="#10B981" />
              <View className="flex-1">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Créateur</Text>
                <Text className="text-base text-gray-900 dark:text-white font-medium">
                  {currentGroup.creator.firstname} {currentGroup.creator.lastname}
                </Text>
              </View>
            </View>
          )}

          {/* Members */}
          <View className="flex-row items-start gap-3">
            <IconSymbol name="person.2.fill" size={20} color="#8B5CF6" />
            <View className="flex-1">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Membres</Text>
              <Text className="text-base text-gray-900 dark:text-white font-medium">
                {currentGroup.groupMemberships?.length || 0} membre{currentGroup.groupMemberships && currentGroup.groupMemberships.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Events */}
          {currentGroup.events && currentGroup.events.length > 0 && (
            <View className="flex-row items-start gap-3">
              <IconSymbol name="calendar" size={20} color="#3B82F6" />
              <View className="flex-1">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Événements</Text>
                <Text className="text-base text-gray-900 dark:text-white font-medium">
                  {currentGroup.events.length} événement{currentGroup.events.length > 1 ? 's' : ''} organisé{currentGroup.events.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Members List */}
        {currentGroup.groupMemberships && currentGroup.groupMemberships.length > 0 && (
          <View className="px-5 pb-5">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Membres du groupe
            </Text>
            <View className="space-y-2">
              {currentGroup.groupMemberships.map((membership) => (
                <View
                  key={membership.id}
                  className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex-row items-center gap-2"
                >
                  <IconSymbol name="person.circle" size={20} color="#6B7280" />
                  <Text className="text-gray-900 dark:text-white">
                    {membership.user?.firstname} {membership.user?.lastname}
                  </Text>
                  {membership.userId === currentGroup.groupcreator && (
                    <View className="bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 rounded-full ml-auto">
                      <Text className="text-xs text-yellow-700 dark:text-yellow-300">Créateur</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Join/Leave Button */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <Pressable
          className={`py-4 px-6 rounded-xl ${
            isMember
              ? 'bg-red-500 active:bg-red-600'
              : 'bg-blue-500 active:bg-blue-600'
          } ${isJoining ? 'opacity-50' : ''}`}
          onPress={handleJoinLeave}
          disabled={isJoining || (user ? currentGroup.groupcreator === user.id : false)}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {isJoining
              ? 'Chargement...'
              : user && currentGroup.groupcreator === user.id
              ? 'Vous êtes le créateur'
              : isMember
              ? 'Quitter le groupe'
              : 'Rejoindre le groupe'}
          </Text>
        </Pressable>
      </View>
    </ThemedView>
  );
}
