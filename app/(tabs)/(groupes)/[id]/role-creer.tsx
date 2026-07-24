import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, TextInput as RNTextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchGroupMembersThunk } from '@/store/thunks/groupsThunks';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { SUGGESTED_ROLE_TITLES } from '@/types/groupRole';
import type { GroupMember } from '@/types/group';

export default function CreateGroupRoleScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const dispatch = useAppDispatch();
  const { groupMembers } = useAppSelector((state) => state.groups);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isSending, setIsSending] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  useEffect(() => {
    dispatch(fetchGroupMembersThunk(groupId));
  }, [groupId]);

  const finalTitle = title === 'autre' ? customTitle.trim() : title;

  const handleCreate = async () => {
    if (!selectedId) {
      showError('Merci de choisir un membre');
      return;
    }
    if (!finalTitle) {
      showError('Merci de choisir ou saisir un rôle');
      return;
    }

    setIsSending(true);
    try {
      await apiService.groupRoles.create(groupId, { userId: selectedId, title: finalTitle });
      showSuccess('Rôle attribué !');
      router.back();
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible d'attribuer ce rôle");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View>
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingBottom: 20 }}
          >
            <SafeAreaView edges={['top']}>
              <View className="flex-row items-center px-5 pt-3 pb-4">
                <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2 mr-2">
                  <IconSymbol name="chevron.left" size={22} color="#fff" />
                </Pressable>
                <Text className="text-white text-lg font-bold">Attribuer un rôle</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        <View className="px-5 pt-5 pb-2">
          <Text className="text-base font-medium text-gray-700 dark:text-gray-300">À qui ?</Text>
        </View>

        <FlatList
          data={groupMembers as GroupMember[]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
          style={{ maxHeight: 200 }}
          renderItem={({ item }) => {
            const isSelected = selectedId === item.id;
            return (
              <Pressable
                onPress={() => setSelectedId(item.id)}
                className={`flex-row items-center gap-3 p-3 rounded-xl mb-2 ${isSelected ? 'bg-blue-50 dark:bg-blue-950 border-2 border-blue-500' : 'bg-gray-50 dark:bg-gray-900 border-2 border-transparent'}`}
              >
                <Avatar name={`${item.firstname} ${item.lastname}`} uri={item.avatar} size={40} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.firstname} {item.lastname}
                  </Text>
                  {item.isCreator && (
                    <Text className="text-xs text-gray-500 dark:text-gray-400">Créateur du groupe</Text>
                  )}
                </View>
                {isSelected && <IconSymbol name="checkmark.circle.fill" size={22} color="#3B82F6" />}
              </Pressable>
            );
          }}
        />

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-base font-medium text-gray-700 dark:text-gray-300">Quel rôle ?</Text>
            <View className="flex-row flex-wrap gap-2">
              {SUGGESTED_ROLE_TITLES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTitle(t)}
                  className={`px-3.5 py-2 rounded-full ${title === t ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-900'}`}
                >
                  <Text className={`text-sm font-semibold ${title === t ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    {t}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => setTitle('autre')}
                className={`px-3.5 py-2 rounded-full ${title === 'autre' ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-900'}`}
              >
                <Text className={`text-sm font-semibold ${title === 'autre' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                  Autre
                </Text>
              </Pressable>
            </View>
          </View>

          {title === 'autre' && (
            <View className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3.5">
              <RNTextInput
                className="text-base text-gray-900 dark:text-white"
                placeholder="Ex: Ambassadeur régional"
                placeholderTextColor="#9ca3af"
                value={customTitle}
                onChangeText={setCustomTitle}
                maxLength={100}
              />
            </View>
          )}

          <View className="flex-row items-start gap-2 bg-blue-50 dark:bg-blue-950 rounded-xl p-3">
            <IconSymbol name="info.circle.fill" size={16} color="#3B82F6" />
            <Text className="flex-1 text-xs text-blue-700 dark:text-blue-300 leading-4">
              Un seul membre peut être Président par groupe. Les autres rôles n'ont pas de limite.
            </Text>
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={isSending}
            className={`rounded-2xl overflow-hidden mt-2 ${isSending ? 'opacity-60' : 'active:opacity-90'}`}
          >
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16 }}
            >
              <Text className="text-white text-center font-bold text-base">
                {isSending ? 'Attribution...' : 'Attribuer le rôle'}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
