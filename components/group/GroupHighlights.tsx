import React from 'react';
import { View, Text } from 'react-native';
import type { GroupStats } from '@/types/group';
import { BRAND } from '@/lib/brand';

const formatMoney = (amount: number) => `${Math.round(amount).toLocaleString('fr-FR')} €`;

interface Props {
  stats: GroupStats | null | undefined;
  memberCount: number;
}

/**
 * Chiffres clés en tête de la page d'un groupe, en bleu roi et or. Pour un
 * visiteur, le serveur envoie un CA arrondi au millier (« plus de 12 000 € »),
 * ou rien si le groupe a choisi de ne pas publier ses chiffres.
 */
export function GroupHighlights({ stats, memberCount }: Props) {
  if (!stats) return null;
  const hasRevenue = !!stats.revenueTotal && stats.revenueTotal > 0;
  if (!hasRevenue && stats.referralsThisMonth === 0 && stats.convertedReferrals === 0 && stats.attendanceRate === null) {
    return null;
  }

  return (
    <View style={{ backgroundColor: BRAND.blue, borderRadius: 20, padding: 16 }} className="mb-5">
      {hasRevenue && (
        <View className="mb-3">
          <Text style={{ color: BRAND.blueMuted }} className="text-xs font-semibold">
            {"Chiffre d'affaires généré entre membres"}
          </Text>
          <Text className="text-3xl font-extrabold text-white mt-0.5">
            {stats.revenueRounded ? 'Plus de ' : ''}
            {formatMoney(stats.revenueTotal!)}
          </Text>
          {!stats.revenueRounded && stats.revenueThisYear !== null && (
            <Text style={{ color: BRAND.blueMuted }} className="text-xs mt-0.5">
              {`dont ${formatMoney(stats.revenueThisYear)} cette année`}
            </Text>
          )}
        </View>
      )}

      <View className="flex-row gap-2">
        <StatTile value={String(stats.referralsThisMonth)} label="Recos du mois" />
        <StatTile value={String(stats.convertedReferrals)} label="Recos conclues" />
        {stats.attendanceRate !== null ? (
          <StatTile value={`${stats.attendanceRate} %`} label="Présence" />
        ) : (
          <StatTile value={String(memberCount)} label={memberCount > 1 ? 'Membres' : 'Membre'} />
        )}
      </View>
    </View>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ backgroundColor: BRAND.blueLight, borderRadius: 12 }} className="flex-1 px-3 py-2.5">
      <Text style={{ color: BRAND.gold }} className="text-xl font-extrabold">
        {value}
      </Text>
      <Text style={{ color: BRAND.blueMuted }} className="text-xs mt-0.5" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
