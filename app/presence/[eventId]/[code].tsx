import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';
import { apiService } from '@/services/apiService';
import { setPostAuthRedirect, clearPostAuthRedirect } from '@/lib/postAuthRedirect';
import { ATTENDANCE_LABEL } from '@/lib/attendance';
import type { AttendanceStatus } from '@/types/event';

/**
 * Ouvert en scannant le QR code de présence avec l'appareil photo
 * (lien universel https://solalys.com/presence/<réunion>/<code>).
 */
export default function CheckInScreen() {
  const { eventId, code } = useLocalSearchParams<{ eventId: string; code: string }>();
  const { user, status: authStatus } = useAppSelector((state) => state.auth);
  const [result, setResult] = useState<{ status: AttendanceStatus; already: boolean; eventName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    if (!eventId || !code || sent.current) return;
    if (!user) {
      // Pas connecté : on garde le lien pour pointer juste après la connexion.
      if (authStatus !== 'loading') {
        setPostAuthRedirect(`/presence/${eventId}/${code}`);
        router.replace('/(auth)/sign-in' as any);
      }
      return;
    }
    sent.current = true;
    clearPostAuthRedirect();
    apiService.attendance
      .checkIn(Number(eventId), String(code))
      .then((res) => {
        setResult({ status: res.data.status, already: res.data.alreadyCheckedIn, eventName: res.data.eventName });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Impossible d'enregistrer votre présence");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      });
  }, [eventId, code, user, authStatus]);

  const goToEvent = () => router.replace(`/(tabs)/(trouver)/${eventId}` as any);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <View className="flex-1 items-center justify-center px-8">
        {!result && !error && (
          <>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text className="text-gray-500 dark:text-gray-400 mt-4">Enregistrement de votre présence...</Text>
          </>
        )}
        {result && (
          <>
            <View className={`rounded-full p-6 ${result.status === 'late' ? 'bg-amber-100' : 'bg-green-100'}`}>
              <IconSymbol name="checkmark.circle.fill" size={64} color={result.status === 'late' ? '#D97706' : '#16A34A'} />
            </View>
            <Text className="text-2xl font-extrabold text-gray-900 dark:text-white mt-6 text-center">
              {result.already ? 'Présence déjà enregistrée' : 'Bienvenue !'}
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-300 mt-2 text-center">
              {`${ATTENDANCE_LABEL[result.status]} · ${result.eventName}`}
            </Text>
          </>
        )}
        {error && (
          <>
            <View className="rounded-full p-6 bg-red-100">
              <IconSymbol name="xmark.circle.fill" size={64} color="#DC2626" />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-white mt-6 text-center">{error}</Text>
          </>
        )}
        {(result || error) && (
          <Pressable onPress={goToEvent} className="mt-8 px-6 py-3 rounded-xl bg-violet-500 active:opacity-80">
            <Text className="text-white font-semibold">{'Voir la réunion'}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
