import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/Avatar';
import { apiService } from '@/services/apiService';
import type { AttendanceHistory } from '@/types/group';

/** Historique de présence (6 mois) : tous les membres pour un responsable, soi-même sinon. */
export default function GroupAttendanceScreen() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<AttendanceHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService.attendance
      .groupHistory(Number(id))
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Impossible de charger l'historique"));
  }, [id]);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-gray-950">
      <View className="flex-row items-center px-5 pt-2 pb-3">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
          <IconSymbol name="chevron.left" size={22} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white ml-1">Présence aux réunions</Text>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base text-gray-700 dark:text-gray-300 text-center">{error}</Text>
        </View>
      ) : !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {data.meetings === 0
              ? "Aucune réunion avec présence prise ces 6 derniers mois. Affichez le QR code de présence lors de la prochaine réunion."
              : `${data.meetings} réunion${data.meetings > 1 ? 's' : ''} sur ${data.months} mois. Les absences prévenues ne comptent pas dans le taux.`}
          </Text>
          {data.members.map((m) => (
            <View key={m.user.id} className="flex-row items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800">
              <Avatar uri={m.user.avatar} name={`${m.user.firstname} ${m.user.lastname}`} size={40} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                  {`${m.user.firstname} ${m.user.lastname}`}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {`${m.present} présent · ${m.late} retard · ${m.excused} excusé · ${m.absent} absent`}
                </Text>
              </View>
              <Text
                className="text-lg font-extrabold"
                style={{ color: m.rate === null ? '#9CA3AF' : m.rate >= 80 ? '#15803D' : m.rate >= 50 ? '#B45309' : '#B91C1C' }}
              >
                {m.rate === null ? '—' : `${m.rate} %`}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
