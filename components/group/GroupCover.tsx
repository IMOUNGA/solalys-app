import React from 'react';
import { View, Text, Image } from 'react-native';
import { BRAND, initialsOf } from '@/lib/brand';

interface CoverProps {
  name: string;
  image?: string | null;
  height: number;
  /** Afficher le badge d'initiales en bas à gauche (page du groupe). */
  showBadge?: boolean;
}

/**
 * Couverture d'un groupe : sa photo, sinon un fond bleu roi avec deux
 * cercles (rappel du soleil) et le badge d'initiales du groupe.
 */
export function GroupCover({ name, image, height, showBadge = true }: CoverProps) {
  if (image) return <Image source={{ uri: image }} style={{ height, width: '100%' }} resizeMode="cover" />;
  return (
    <View style={{ height, backgroundColor: BRAND.blue, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', right: -60, top: -40, width: 260, height: 260, borderRadius: 130, backgroundColor: BRAND.blueLight }} />
      <View style={{ position: 'absolute', right: 30, top: 50, width: 120, height: 120, borderRadius: 60, backgroundColor: BRAND.blueLighter }} />
      <View style={{ position: 'absolute', right: 62, top: 82, width: 14, height: 14, borderRadius: 7, backgroundColor: BRAND.gold }} />
      {showBadge && (
        <View style={{ position: 'absolute', left: 20, bottom: 30 }}>
          <GroupBadge name={name} size={60} />
        </View>
      )}
    </View>
  );
}

/** Badge carré aux initiales du groupe (listes, couverture sans photo). */
export function GroupBadge({ name, size = 48, inverted = false }: { name: string; size?: number; inverted?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: inverted ? BRAND.blue : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: inverted ? '#FFFFFF' : BRAND.blue, fontSize: size * 0.36, fontWeight: '700' }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
