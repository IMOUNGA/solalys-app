import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { GroupStats } from '@/types/group';

const formatMoney = (amount: number) => `${Math.round(amount).toLocaleString('fr-FR')} €`;

interface Props {
  stats: GroupStats | null | undefined;
  memberCount: number;
}

/**
 * Chiffres clés en tête de la page d'un groupe. Pour un visiteur, le serveur
 * envoie un CA arrondi au millier (« plus de 12 000 € »), ou rien si le groupe
 * a choisi de ne pas publier ses chiffres.
 */
export function GroupHighlights({ stats, memberCount }: Props) {
  if (!stats) return null;
  const hasRevenue = !!stats.revenueTotal && stats.revenueTotal > 0;
  if (!hasRevenue && stats.referralsThisMonth === 0 && stats.convertedReferrals === 0) return null;

  return (
    <View className="mb-6">
      {hasRevenue && (
        <LinearGradient
          colors={['#10B981', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 20, marginBottom: 10 }}
        >
          <View className="flex-row items-center gap-2 mb-1">
            <IconSymbol name="eurosign.circle.fill" size={16} color="#ECFDF5" />
            <Text className="text-xs font-semibold text-emerald-50 uppercase tracking-wide">
              Chiffre d&apos;affaires généré entre membres
            </Text>
          </View>
          <Text className="text-3xl font-extrabold text-white">
            {stats.revenueRounded ? 'Plus de ' : ''}
            {formatMoney(stats.revenueTotal!)}
          </Text>
          {!stats.revenueRounded && stats.revenueThisYear !== null && (
            <Text className="text-sm text-emerald-50 mt-1">
              dont {formatMoney(stats.revenueThisYear)} cette année
            </Text>
          )}
        </LinearGradient>
      )}

      <View className="flex-row gap-2.5">
        <StatTile value={String(stats.referralsThisMonth)} label="Recommandations ce mois-ci" color="#8B5CF6" />
        <StatTile value={String(stats.convertedReferrals)} label="Affaires conclues" color="#F59E0B" />
        {stats.attendanceRate !== null ? (
          <StatTile value={`${stats.attendanceRate} %`} label="Présence aux réunions" color="#10B981" />
        ) : (
          <StatTile value={String(memberCount)} label={memberCount > 1 ? 'Membres' : 'Membre'} color="#3B82F6" />
        )}
      </View>
    </View>
  );
}

function StatTile({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl px-3 py-3.5">
      <Text style={{ color }} className="text-2xl font-extrabold">
        {value}
      </Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}
