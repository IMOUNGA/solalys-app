import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { apiService } from '@/services/apiService';
import { useAlert, useErrorAlert } from '@/hooks/useAlert';
import { ATTENDANCE_COLOR, ATTENDANCE_LABEL, formatTime } from '@/lib/attendance';
import type { AttendanceSheet, AttendanceStatus } from '@/types/event';

/** Feuille de présence d'une réunion ; les responsables peuvent pointer à la main. */
export default function AttendanceSheetScreen() {
  const { id } = useLocalSearchParams();
  const eventId = Number(id);
  const [sheet, setSheet] = useState<AttendanceSheet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { showAlert } = useAlert();
  const showError = useErrorAlert();

  const load = useCallback(async () => {
    try {
      const res = await apiService.attendance.sheet(eventId);
      setSheet(res.data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de charger la liste de présence');
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const canMarkNow = sheet ? sheet.canManage && Date.now() >= new Date(sheet.opensAt).getTime() : false;

  const setStatus = async (userId: number, status: AttendanceStatus | null) => {
    try {
      if (status) await apiService.attendance.mark(eventId, userId, status);
      else await apiService.attendance.reset(eventId, userId);
      await load();
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Impossible de modifier le pointage');
    }
  };

  const openMenu = (member: AttendanceSheet['members'][number]) => {
    if (!canMarkNow) return;
    const statuses: AttendanceStatus[] = ['present', 'late', 'excused', 'absent'];
    showAlert({
      title: `${member.user.firstname} ${member.user.lastname}`,
      message: 'Pointer à la main',
      buttons: [
        ...statuses.map((s) => ({ text: ATTENDANCE_LABEL[s], style: 'default' as const, onPress: () => setStatus(member.user.id, s) })),
        ...(member.status ? [{ text: 'Effacer', style: 'destructive' as const, onPress: () => setStatus(member.user.id, null) }] : []),
        { text: 'Annuler', style: 'cancel' as const },
      ],
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <View className="flex-row items-center px-5 pt-2 pb-3">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white ml-1">Liste de présence</Text>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base text-gray-700 dark:text-gray-300 text-center">{error}</Text>
        </View>
      ) : !sheet ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2345C2" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        >
          <Text className="text-base font-semibold text-gray-900 dark:text-white">{sheet.event.name}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {new Date(sheet.event.hours).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {` · ${formatTime(sheet.event.hours)}`}
          </Text>

          <View className="flex-row gap-2 mb-5">
            <Count label="Présents" value={sheet.summary.present + sheet.summary.late} color="#15803D" />
            <Count label="Excusés" value={sheet.summary.excused} color="#4338CA" />
            <Count label={sheet.finalized ? 'Absents' : 'Pas encore là'} value={sheet.summary.absent + sheet.summary.unknown} color="#B91C1C" />
            <Count label="Invités" value={sheet.summary.guests} color="#DB2777" />
          </View>

          {sheet.canManage && (
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {canMarkNow
                ? 'Touchez un membre pour le pointer à la main (sans téléphone, oubli...).'
                : 'Le pointage manuel ouvre 30 minutes avant le début.'}
            </Text>
          )}

          {sheet.members.map((m) => {
            const color = m.status ? ATTENDANCE_COLOR[m.status] : null;
            return (
              <Pressable
                key={m.user.id}
                onPress={() => openMenu(m)}
                disabled={!canMarkNow}
                className="flex-row items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800 active:opacity-70"
              >
                <Avatar uri={m.user.avatar} name={`${m.user.firstname} ${m.user.lastname}`} size={40} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                    {`${m.user.firstname} ${m.user.lastname}`}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                    {m.status === 'excused' && m.note
                      ? `Remplacé(e) par ${m.note}`
                      : m.checkedInAt
                        ? `Arrivé(e) à ${formatTime(m.checkedInAt)}`
                        : m.user.metier || ''}
                  </Text>
                </View>
                <View style={{ backgroundColor: color?.bg ?? '#F3F4F6' }} className="rounded-full px-3 py-1">
                  <Text style={{ color: color?.text ?? '#6B7280' }} className="text-xs font-semibold">
                    {m.status ? ATTENDANCE_LABEL[m.status] : '—'}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {sheet.guests.length > 0 && (
            <>
              <Text className="text-base font-bold text-gray-900 dark:text-white mt-6 mb-1">
                {`Invités venus (${sheet.guests.length})`}
              </Text>
              {sheet.guests.map((g) => (
                <View key={g.id} className="flex-row items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800">
                  <Avatar name={`${g.firstname} ${g.lastname}`} size={40} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 dark:text-white">{`${g.firstname} ${g.lastname}`}</Text>
                    {g.metier ? <Text className="text-xs text-gray-500 dark:text-gray-400">{g.metier}</Text> : null}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Count({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl px-3 py-3">
      <Text style={{ color }} className="text-2xl font-extrabold">{value}</Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}
