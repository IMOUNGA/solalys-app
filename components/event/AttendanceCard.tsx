import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService } from '@/services/apiService';
import { useErrorAlert, useSuccessAlert } from '@/hooks/useAlert';
import { ATTENDANCE_COLOR, ATTENDANCE_LABEL, formatTime } from '@/lib/attendance';
import type { Event } from '@/types/event';

const MIN = 60_000;

interface Props {
  event: Event;
  onChanged: () => void;
}

/**
 * Présence à une réunion de groupe, pour ses membres : statut, absence
 * prévenue, et pour les responsables le QR code et la liste de présence.
 */
export function AttendanceCard({ event, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const showError = useErrorAlert();
  const showSuccess = useSuccessAlert();

  // Absent de la réponse : pas membre du groupe (ou événement sans groupe).
  if (!event.groupId || event.myAttendance === undefined) return null;

  const start = new Date(event.hours).getTime();
  const opensAt = start - 30 * MIN;
  const closesAt = start + 60 * MIN;
  const now = Date.now();
  const before = now < start;
  const open = now >= opensAt && now <= closesAt;
  const mine = event.myAttendance;
  const color = mine ? ATTENDANCE_COLOR[mine.status] : null;

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      showSuccess(success);
      onChanged();
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setBusy(false);
    }
  };

  const excuse = () => {
    const send = (replacement?: string) =>
      run(() => apiService.attendance.excuse(event.id, replacement?.trim() || undefined), 'Absence prévenue');
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Je serai absent',
        'Un remplaçant viendra à votre place ? Indiquez son nom (facultatif).',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Prévenir', onPress: (value?: string) => send(value) },
        ],
        'plain-text',
      );
    } else {
      send();
    }
  };

  return (
    <View className="bg-white rounded-2xl p-4">
      <View className="flex-row items-center gap-2 mb-2">
        <IconSymbol name="checkmark.circle.fill" size={18} color="#2345C2" />
        <Text className="text-base font-bold text-gray-900 dark:text-white flex-1">Présence</Text>
        {mine && color && (
          <View style={{ backgroundColor: color.bg }} className="rounded-full px-3 py-1">
            <Text style={{ color: color.text }} className="text-xs font-semibold">
              {ATTENDANCE_LABEL[mine.status]}
              {mine.checkedInAt ? ` · ${formatTime(mine.checkedInAt)}` : ''}
            </Text>
          </View>
        )}
      </View>

      {mine?.status === 'excused' && mine.note && (
        <Text className="text-xs text-gray-600 dark:text-gray-300 mb-2">{`Remplaçant : ${mine.note}`}</Text>
      )}

      {!mine && (before || open) && (
        <Text className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {open
            ? "À votre arrivée, scannez le QR code du responsable avec l'appareil photo de votre téléphone."
            : `Pointage à partir de ${formatTime(new Date(opensAt).toISOString())} : scannez le QR code du responsable avec l'appareil photo.`}
        </Text>
      )}

      <View className="flex-row flex-wrap gap-2">
        {event.canManageAttendance && (
          <Pressable
            onPress={() => router.push(`/(tabs)/(trouver)/${event.id}/qr` as any)}
            disabled={!open}
            className={`rounded-xl bg-brand px-4 py-2.5 ${open ? 'active:opacity-80' : 'opacity-40'}`}
          >
            <Text className="text-white text-sm font-semibold">Afficher le QR code</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => router.push(`/(tabs)/(trouver)/${event.id}/presence` as any)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 active:opacity-70"
        >
          <Text className="text-sm font-semibold text-gray-900 dark:text-white">Liste de présence</Text>
        </Pressable>
        {before && !mine && (
          <Pressable onPress={excuse} disabled={busy} className="rounded-xl px-4 py-2.5 active:opacity-70">
            <Text className="text-sm font-semibold text-red-500">Je serai absent</Text>
          </Pressable>
        )}
        {before && mine?.status === 'excused' && (
          <Pressable
            onPress={() => run(() => apiService.attendance.cancelExcuse(event.id), 'Absence annulée')}
            disabled={busy}
            className="rounded-xl px-4 py-2.5 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-brand-600">Je viendrai finalement</Text>
          </Pressable>
        )}
      </View>
      {event.canManageAttendance && !open && before && (
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {`Le QR code s'affiche à partir de ${formatTime(new Date(opensAt).toISOString())}.`}
        </Text>
      )}
    </View>
  );
}
