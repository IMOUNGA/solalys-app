import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, SectionList, FlatList, Pressable, ActivityIndicator, SafeAreaView, RefreshControl, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuccessAlert, useErrorAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { Guest, GUEST_STATUSES, GuestStatus, UPCOMING_GUEST_STATUSES } from '@/types/guest';

type TabType = 'upcoming' | 'follow-up';

const monthLabel = (dateString: string) => {
  const label = new Date(dateString).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const followUpStatusInfo = (status: string) => GUEST_STATUSES.find((s) => s.value === status) ?? GUEST_STATUSES[0];
const upcomingStatusInfo = (status: string) => UPCOMING_GUEST_STATUSES.find((s) => s.value === status) ?? UPCOMING_GUEST_STATUSES[0];

const formatShortDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export default function GuestsScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const groupId = Number(id);
  const [tab, setTab] = useState<TabType>(initialTab === 'follow-up' ? 'follow-up' : 'upcoming');

  const [upcoming, setUpcoming] = useState<Guest[]>([]);
  const [followUp, setFollowUp] = useState<Guest[]>([]);
  const [followUpRestricted, setFollowUpRestricted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<GuestStatus[]>(GUEST_STATUSES.map((s) => s.value));
  const showSuccess = useSuccessAlert();
  const showError = useErrorAlert();

  const load = useCallback(async () => {
    try {
      const res = await apiService.guests.getUpcoming(groupId);
      setUpcoming(res.data || []);
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible de charger les invités à venir");
    }

    try {
      const res = await apiService.guests.getFollowUp(groupId);
      setFollowUp(res.data || []);
      setFollowUpRestricted(false);
    } catch {
      // 403 attendu si pas Pro+ / pas gouvernance — écran dédié plutôt qu'une alerte
      setFollowUpRestricted(true);
    }
  }, [groupId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleValidate = async (guest: Guest) => {
    setBusyId(guest.id);
    try {
      await apiService.guests.validate(guest.id);
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (guest: Guest) => {
    setBusyId(guest.id);
    try {
      await apiService.guests.remove(guest.id);
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAttended = async (guest: Guest) => {
    setBusyId(guest.id);
    try {
      await apiService.guests.markAttended(guest.id);
      showSuccess(`${guest.firstname} peut maintenant être suivi(e)`, 'Venue confirmée');
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const toggleExpand = (guest: Guest) => {
    if (expandedId === guest.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(guest.id);
    setNotesDraft(guest.notes ?? '');
    setFeedbackDraft(guest.feedback ?? '');
  };

  const handleStatusChange = async (guest: Guest, status: GuestStatus) => {
    setBusyId(guest.id);
    try {
      await apiService.guests.update(guest.id, { status });
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveNotes = async (guest: Guest) => {
    setBusyId(guest.id);
    try {
      await apiService.guests.update(guest.id, { notes: notesDraft.trim(), feedback: feedbackDraft.trim() });
      showSuccess(`Le suivi de ${guest.firstname} a bien été enregistré`, 'Mis à jour');
      setExpandedId(null);
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (guest: Guest) => {
    setBusyId(guest.id);
    try {
      await apiService.guests.remove(guest.id);
      setExpandedId(null);
      await load();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await apiService.guests.exportCsv(groupId);
      const file = new File(Paths.cache, `invites-groupe-${groupId}.csv`);
      if (file.exists) file.delete();
      file.create();
      file.write(res.data);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export invités' });
      } else {
        showSuccess(`Fichier enregistré : ${file.uri}`, 'Export terminé');
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || "Impossible d'exporter le suivi");
    } finally {
      setExporting(false);
    }
  };

  const toggleStatusFilter = (status: GuestStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

  const filteredFollowUp = followUp.filter((g) => statusFilter.includes(g.status as GuestStatus));

  const followUpSections = filteredFollowUp.reduce<{ title: string; data: Guest[] }[]>((acc, guest) => {
    const title = monthLabel(guest.createdat);
    const section = acc.find((s) => s.title === title);
    if (section) section.data.push(guest);
    else acc.push({ title, data: [guest] });
    return acc;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">Espace invités</Text>
        {tab === 'upcoming' && (
          <Pressable
            onPress={() => router.push(`/(tabs)/(groupes)/${groupId}/invite-creer` as any)}
            className="w-9 h-9 items-center justify-center bg-violet-500 rounded-full active:opacity-80"
          >
            <IconSymbol name="plus" size={18} color="#fff" />
          </Pressable>
        )}
        {tab === 'follow-up' && !followUpRestricted && (
          <Pressable onPress={handleExportCsv} disabled={exporting} className="w-9 h-9 items-center justify-center active:opacity-70">
            {exporting ? <ActivityIndicator size="small" color="#8B5CF6" /> : <IconSymbol name="square.and.arrow.up" size={20} color="#8B5CF6" />}
          </Pressable>
        )}
      </View>

      <View className="flex-row gap-3 px-5 py-3 bg-white dark:bg-gray-900">
        <Pressable
          onPress={() => setTab('upcoming')}
          className={`flex-1 py-2.5 rounded-xl ${tab === 'upcoming' ? 'bg-violet-500' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-center font-semibold text-sm ${tab === 'upcoming' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            À venir ({upcoming.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('follow-up')}
          className={`flex-1 py-2.5 rounded-xl ${tab === 'follow-up' ? 'bg-violet-500' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-center font-semibold text-sm ${tab === 'follow-up' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            À suivre {followUpRestricted ? '🔒' : `(${followUp.length})`}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : tab === 'upcoming' ? (
        <FlatList
          data={upcoming}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
          renderItem={({ item }) => {
            const info = upcomingStatusInfo(item.status);
            const isBusy = busyId === item.id;
            return (
              <View
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-bold text-gray-900 dark:text-white flex-1">
                    {item.firstname} {item.lastname}
                  </Text>
                  <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${info.color}22` }}>
                    <Text className="text-xs font-semibold" style={{ color: info.color }}>{info.label}</Text>
                  </View>
                </View>
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {item.metier ? `${item.metier} · ` : ''}Proposé par {item.broughtBy.firstname} {item.broughtBy.lastname}
                  </Text>
                  {item.visitDate && (
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <IconSymbol name="calendar" size={13} color="#8B5CF6" />
                      <Text className="text-xs font-semibold text-violet-500">Vient le {formatShortDate(item.visitDate)}</Text>
                    </View>
                  )}
                </View>

                {item.status === 'en_attente' && (
                  <View className="flex-row items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Pressable onPress={() => handleReject(item)} disabled={isBusy} className="active:opacity-70">
                      <Text className="text-xs font-semibold text-red-500">Rejeter</Text>
                    </Pressable>
                    <View className="flex-1" />
                    <Pressable
                      onPress={() => handleValidate(item)}
                      disabled={isBusy}
                      className="rounded-full px-4 py-2 bg-violet-500 active:opacity-80"
                    >
                      <Text className="text-xs font-bold text-white">{isBusy ? '...' : 'Valider'}</Text>
                    </Pressable>
                  </View>
                )}

                {item.status === 'a_venir' && (
                  <View className="pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Pressable
                      onPress={() => handleMarkAttended(item)}
                      disabled={isBusy}
                      className="rounded-full px-4 py-2 bg-green-500 self-start active:opacity-80"
                    >
                      <Text className="text-xs font-bold text-white">{isBusy ? '...' : 'Marquer venu(e)'}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
                <IconSymbol name="person.crop.circle.badge.plus" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
                Aucun invité à venir
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                N'importe quel membre peut proposer un invité — la demande sera validée par la gouvernance du groupe
              </Text>
            </View>
          }
        />
      ) : followUpRestricted ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
            <IconSymbol name="lock.fill" size={36} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
            Accès réservé
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center">
            Le suivi des invités (conversion, relances, export) est réservé au président, vice-président ou secrétaire du groupe, avec un abonnement Pro ou supérieur.
          </Text>
        </View>
      ) : (
        <SectionList
          ListHeaderComponent={
            <View className="flex-row flex-wrap gap-2 mb-1">
              {GUEST_STATUSES.map((s) => {
                const active = statusFilter.includes(s.value);
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => toggleStatusFilter(s.value)}
                    className="px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: active ? s.color : '#F3F4F6' }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : '#6B7280' }}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          }
          sections={followUpSections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
          renderSectionHeader={({ section }) => (
            <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 mt-4">{section.title}</Text>
          )}
          renderItem={({ item }) => {
            const info = followUpStatusInfo(item.status);
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
                      <Text className="text-xs font-semibold" style={{ color: info.color }}>{info.label}</Text>
                    </View>
                  </View>

                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {item.metier ? `${item.metier} · ` : ''}Amené par {item.broughtBy.firstname} {item.broughtBy.lastname} · {formatShortDate(item.createdat)}
                  </Text>

                  {item.notes && !isExpanded && (
                    <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1" numberOfLines={2}>{item.notes}</Text>
                  )}
                  {item.feedback && !isExpanded && (
                    <Text className="text-sm text-violet-600 dark:text-violet-400 italic mt-1" numberOfLines={2}>
                      "{item.feedback}"
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
                            disabled={busyId === item.id}
                            className="px-3 py-1.5 rounded-full"
                            style={{ backgroundColor: item.status === s.value ? s.color : '#F3F4F6' }}
                          >
                            <Text className="text-xs font-semibold" style={{ color: item.status === s.value ? '#fff' : '#6B7280' }}>
                              {s.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <View className="gap-1.5">
                        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Note de suivi (interne)</Text>
                        <TextInput
                          value={notesDraft}
                          onChangeText={setNotesDraft}
                          placeholder="Prochaine étape, relance prévue..."
                          placeholderTextColor="#9CA3AF"
                          multiline
                          maxLength={1000}
                          className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl p-3 min-h-16"
                          style={{ textAlignVertical: 'top' }}
                        />
                      </View>

                      <View className="gap-1.5">
                        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Avis de l'invité</Text>
                        <TextInput
                          value={feedbackDraft}
                          onChangeText={setFeedbackDraft}
                          placeholder="Ce qu'il/elle en a pensé..."
                          placeholderTextColor="#9CA3AF"
                          multiline
                          maxLength={1000}
                          className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl p-3 min-h-16"
                          style={{ textAlignVertical: 'top' }}
                        />
                      </View>

                      <View className="flex-row items-center justify-between">
                        <Pressable onPress={() => handleDelete(item)} disabled={busyId === item.id} className="active:opacity-70">
                          <Text className="text-xs font-semibold text-red-500">Supprimer</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleSaveNotes(item)}
                          disabled={busyId === item.id}
                          className="rounded-full px-4 py-2 bg-violet-500 active:opacity-80"
                        >
                          <Text className="text-xs font-bold text-white">Enregistrer</Text>
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
                <IconSymbol name="checkmark.circle" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
                {followUp.length === 0 ? 'Aucun invité à suivre pour l\'instant' : 'Aucun invité pour ce filtre'}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                {followUp.length === 0
                  ? 'Marquez un invité "à venir" comme venu pour démarrer son suivi'
                  : 'Essayez de sélectionner un autre statut ci-dessus'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
