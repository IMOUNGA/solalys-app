import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, SectionList, Pressable, ActivityIndicator, SafeAreaView, RefreshControl, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { Guest, GUEST_STATUSES, GuestStatus } from '@/types/guest';

const monthLabel = (dateString: string) => {
  const label = new Date(dateString).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const statusInfo = (status: GuestStatus) => GUEST_STATUSES.find((s) => s.value === status) ?? GUEST_STATUSES[0];

const formatShortDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export default function GuestsScreen() {
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const load = useCallback(async () => {
    try {
      const response = await apiService.guests.getForGroup(groupId);
      setGuests(response.data || []);
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible de charger l'espace invités");
    }
  }, [groupId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleExpand = (guest: Guest) => {
    if (expandedId === guest.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(guest.id);
    setNotesDraft(guest.notes ?? '');
  };

  const handleStatusChange = async (guest: Guest, status: GuestStatus) => {
    setSaving(true);
    try {
      await apiService.guests.update(guest.id, { status });
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async (guest: Guest) => {
    setSaving(true);
    try {
      await apiService.guests.update(guest.id, { notes: notesDraft.trim() });
      showSuccess('Note enregistrée');
      setExpandedId(null);
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (guest: Guest) => {
    setSaving(true);
    try {
      await apiService.guests.remove(guest.id);
      setExpandedId(null);
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  // Regroupement par mois (les invités arrivent déjà triés du plus récent au plus ancien)
  const sections = guests.reduce<{ title: string; data: Guest[] }[]>((acc, guest) => {
    const title = monthLabel(guest.createdat);
    const section = acc.find((s) => s.title === title);
    if (section) {
      section.data.push(guest);
    } else {
      acc.push({ title, data: [guest] });
    }
    return acc;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">Espace invités</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">12 derniers mois glissants</Text>
        </View>
        <Pressable
          onPress={() => router.push(`/(tabs)/(groupes)/${groupId}/invite-creer` as any)}
          className="w-9 h-9 items-center justify-center bg-violet-500 rounded-full active:opacity-80"
        >
          <IconSymbol name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
          renderSectionHeader={({ section }) => (
            <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 mt-4">
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => {
            const info = statusInfo(item.status);
            const isExpanded = expandedId === item.id;

            return (
              <Pressable onPress={() => toggleExpand(item)} className="active:opacity-90 mb-3">
                <View
                  className="bg-white dark:bg-gray-900 rounded-2xl p-4"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-base font-bold text-gray-900 dark:text-white flex-1">
                      {item.firstname} {item.lastname}
                    </Text>
                    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${info.color}22` }}>
                      <Text className="text-xs font-semibold" style={{ color: info.color }}>
                        {info.label}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {item.metier ? `${item.metier} · ` : ''}Amené par {item.broughtBy.firstname} {item.broughtBy.lastname} · {formatShortDate(item.createdat)}
                  </Text>

                  {item.notes && !isExpanded && (
                    <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1" numberOfLines={2}>
                      {item.notes}
                    </Text>
                  )}

                  {isExpanded && (
                    <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 gap-3">
                      {(item.email || item.phone) && (
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          {item.email ?? ''}{item.email && item.phone ? ' · ' : ''}{item.phone ?? ''}
                        </Text>
                      )}

                      <View className="flex-row flex-wrap gap-2">
                        {GUEST_STATUSES.map((s) => (
                          <Pressable
                            key={s.value}
                            onPress={() => handleStatusChange(item, s.value)}
                            disabled={saving}
                            className="px-3 py-1.5 rounded-full"
                            style={{ backgroundColor: item.status === s.value ? s.color : '#F3F4F6' }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: item.status === s.value ? '#fff' : '#6B7280' }}
                            >
                              {s.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <TextInput
                        value={notesDraft}
                        onChangeText={setNotesDraft}
                        placeholder="Note de suivi..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        maxLength={1000}
                        className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl p-3 min-h-16"
                        style={{ textAlignVertical: 'top' }}
                      />

                      <View className="flex-row items-center justify-between">
                        <Pressable onPress={() => handleDelete(item)} disabled={saving} className="active:opacity-70">
                          <Text className="text-xs font-semibold text-red-500">Supprimer</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleSaveNotes(item)}
                          disabled={saving}
                          className="rounded-full px-4 py-2 bg-violet-500 active:opacity-80"
                        >
                          <Text className="text-xs font-bold text-white">Enregistrer la note</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
                <IconSymbol name="person.crop.circle.badge.plus" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
                Aucun invité sur les 12 derniers mois
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                Enregistrez les personnes amenées par les membres pour suivre leur conversion
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
