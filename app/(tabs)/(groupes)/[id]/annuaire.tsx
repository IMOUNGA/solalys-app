import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, SafeAreaView, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchGroupMembersThunk } from '@/store/thunks/groupsThunks';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import type { GroupMember } from '@/types/group';

export default function GroupDirectoryScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { groupMembers, membersStatus } = useAppSelector((state) => state.groups);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (id && !isNaN(Number(id))) {
      dispatch(fetchGroupMembersThunk(Number(id)));
    }
  }, [id]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groupMembers as GroupMember[];

    return (groupMembers as GroupMember[]).filter((m) => {
      const haystack = [
        m.firstname,
        m.lastname,
        m.metier,
        m.offre,
        m.recherche,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [groupMembers, query]);

  const renderMember = ({ item }: { item: GroupMember }) => (
    <View
      className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center gap-3 mb-1">
        <Avatar uri={item.avatar} name={`${item.firstname} ${item.lastname}`} size={48} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-gray-900 dark:text-white">
              {item.firstname} {item.lastname}
            </Text>
            {item.isCreator && (
              <View className="bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                <Text className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Créateur
                </Text>
              </View>
            )}
          </View>
          {item.metier ? (
            <View className="flex-row items-center gap-1 mt-1">
              <IconSymbol name="briefcase.fill" size={12} color="#8B5CF6" />
              <Text className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                {item.metier}
              </Text>
            </View>
          ) : (
            <Text className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Métier non renseigné
            </Text>
          )}
        </View>
      </View>

      {(item.offre || item.recherche) && (
        <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 gap-2">
          {item.offre && (
            <View className="flex-row items-start gap-2">
              <IconSymbol name="megaphone.fill" size={14} color="#10B981" />
              <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                <Text className="font-semibold">Propose : </Text>
                {item.offre}
              </Text>
            </View>
          )}
          {item.recherche && (
            <View className="flex-row items-start gap-2">
              <IconSymbol name="magnifyingglass" size={14} color="#3B82F6" />
              <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                <Text className="font-semibold">Recherche : </Text>
                {item.recherche}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center -ml-2"
        >
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">
          Annuaire {groupMembers.length > 0 ? `(${groupMembers.length})` : ''}
        </Text>
      </View>

      {/* Recherche */}
      <View className="px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5">
          <IconSymbol name="magnifyingglass" size={18} color="#9CA3AF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un métier, une offre..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-base text-gray-900 dark:text-white"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {membersStatus === 'loading' && groupMembers.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMember}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
                <IconSymbol name="person.2.slash" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
                {query ? 'Aucun résultat' : 'Aucun membre'}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                {query
                  ? 'Essayez un autre métier ou mot-clé'
                  : 'Ce groupe n\'a pas encore de membres'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
