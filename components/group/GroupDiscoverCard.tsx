import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import type { DiscoverGroup } from '@/services/apiService';
import { BRAND } from '@/lib/brand';
import { weeklyRhythm } from '@/lib/rhythm';
import { formatDistance } from '@/utils/distance';
import { GroupBadge } from './GroupCover';

const WIDTH = 170;

/** Carte compacte d'un groupe pour le carrousel « Groupes près de chez vous ». */
export function GroupDiscoverCard({ group }: { group: DiscoverGroup }) {
  const rhythm = group.meeting ? weeklyRhythm(group.meeting.dayOfWeek, group.meeting.startTime) : null;
  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/(groupes)/${group.id}` as any)}
      className="bg-white rounded-2xl overflow-hidden active:opacity-80"
      style={{
        width: WIDTH,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ height: 70, backgroundColor: BRAND.blue, overflow: 'hidden' }}>
        {group.image ? (
          <Image source={{ uri: group.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <>
            <View style={{ position: 'absolute', right: -30, top: -30, width: 110, height: 110, borderRadius: 55, backgroundColor: BRAND.blueLight }} />
            <View style={{ position: 'absolute', right: 16, top: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.gold }} />
          </>
        )}
      </View>
      {/* Badge à cheval sur la couverture, hors de son cadre (sinon il serait coupé) */}
      <View style={{ position: 'absolute', left: 10, top: 52, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
        <GroupBadge name={group.name} size={32} />
      </View>
      <View className="px-3 pb-3" style={{ paddingTop: 22 }}>
        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
          {group.name}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {rhythm ? rhythm.replace('Tous les ', '').replace(/^./, (c) => c.toUpperCase()) : group.city}
          {` · ${group.memberCount} membre${group.memberCount > 1 ? 's' : ''}`}
        </Text>
        <Text className="text-xs font-semibold mt-1.5" style={{ color: group.isMember ? BRAND.blue : group.revenueRounded ? '#9A6A00' : '#64748B' }} numberOfLines={1}>
          {group.isMember
            ? 'Vous êtes membre'
            : group.revenueRounded
              ? `+${group.revenueRounded.toLocaleString('fr-FR')} € générés`
              : group.distance !== null
                ? `À ${formatDistance(group.distance / 1000)}`
                : group.city}
        </Text>
      </View>
    </Pressable>
  );
}
