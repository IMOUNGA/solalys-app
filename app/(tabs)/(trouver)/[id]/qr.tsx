import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { QrCode } from '@/components/QrCode';
import { apiService } from '@/services/apiService';
import { formatTime } from '@/lib/attendance';
import type { AttendanceSheet } from '@/types/event';

/**
 * QR code de présence affiché par un responsable à l'entrée de la réunion.
 * Il change toutes les 30 s : une photo envoyée à un absent ne sert à rien.
 */
export default function AttendanceQrScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams();
  const eventId = Number(id);
  const { width } = useWindowDimensions();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [summary, setSummary] = useState<AttendanceSheet['summary'] | null>(null);
  const [closesAt, setClosesAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextAt = useRef(0);

  const loadCode = useCallback(async () => {
    try {
      const res = await apiService.attendance.qr(eventId);
      setUrl(res.data.url);
      setClosesAt(res.data.closesAt);
      setError(null);
      // Un peu avant le changement côté serveur, au moins toutes les 5 s en cas de décalage.
      const delay = Math.max(1000, res.data.refreshInMs + 300);
      nextAt.current = Date.now() + delay;
      timer.current = setTimeout(loadCode, delay);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible d’afficher le QR code');
      setUrl(null);
    }
  }, [eventId]);

  useEffect(() => {
    loadCode();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [loadCode]);

  // Compte à rebours et compteur de présents (rafraîchi toutes les 5 s).
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((nextAt.current - Date.now()) / 1000)));
    }, 1000);
    const loadSummary = () =>
      apiService.attendance
        .sheet(eventId)
        .then((res) => setSummary(res.data.summary))
        .catch(() => {});
    loadSummary();
    const poll = setInterval(loadSummary, 5000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [eventId]);

  const qrSize = Math.min(width - 48, 380);
  const arrived = summary ? summary.present + summary.late : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View className="flex-row items-center px-5 pt-2">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 ml-1">QR code de présence</Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        {error ? (
          <View className="items-center">
            <IconSymbol name="exclamationmark.triangle.fill" size={40} color="#F59E0B" />
            <Text className="text-base font-semibold text-gray-900 mt-4 text-center">{error}</Text>
            <Pressable onPress={loadCode} className="mt-6 px-6 py-3 rounded-xl bg-violet-500 active:opacity-80">
              <Text className="text-white font-semibold">Réessayer</Text>
            </Pressable>
          </View>
        ) : !url ? (
          <ActivityIndicator size="large" color="#8B5CF6" />
        ) : (
          <>
            <Text className="text-base text-gray-600 text-center mb-5">
              {"Scannez avec l'appareil photo de votre téléphone"}
            </Text>
            <QrCode value={url} size={qrSize} />
            <Text className="text-sm text-gray-500 mt-4">{`Nouveau code dans ${secondsLeft} s`}</Text>
            {closesAt && (
              <Text className="text-xs text-gray-400 mt-1">{`Pointage ouvert jusqu'à ${formatTime(closesAt)}`}</Text>
            )}
          </>
        )}
      </View>

      <View className="px-6 pb-6 gap-3">
        {summary && (
          <Text className="text-center text-base font-bold text-gray-900">
            {`${arrived} arrivé${arrived > 1 ? 's' : ''} sur ${summary.total}`}
            {summary.excused ? ` · ${summary.excused} excusé${summary.excused > 1 ? 's' : ''}` : ''}
            {summary.guests ? ` · ${summary.guests} invité${summary.guests > 1 ? 's' : ''}` : ''}
          </Text>
        )}
        <Pressable
          onPress={() => router.push(`/(tabs)/(trouver)/${eventId}/presence` as any)}
          className="rounded-2xl border border-gray-200 py-4 active:opacity-80"
        >
          <Text className="text-center font-semibold text-gray-900">{'Liste de présence et pointage manuel'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
