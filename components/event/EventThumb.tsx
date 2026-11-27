import React from 'react';
import { View, Text, Image } from 'react-native';
import { BRAND, initialsOf } from '@/lib/brand';

/** Vignette d'un événement : sa photo, sinon bleu roi aux initiales du groupe (ou de l'événement). */
export function EventThumb({ image, name, size = 60 }: { image?: string | null; name: string; size?: number }) {
  if (image) {
    return <Image source={{ uri: image }} style={{ width: size, height: size, borderRadius: 14 }} resizeMode="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: 14, backgroundColor: BRAND.blue, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', right: -size * 0.35, top: -size * 0.35, width: size, height: size, borderRadius: size / 2, backgroundColor: BRAND.blueLight }} />
      <View style={{ position: 'absolute', right: size * 0.16, top: size * 0.16, width: 7, height: 7, borderRadius: 4, backgroundColor: BRAND.gold }} />
      <Text style={{ position: 'absolute', left: 8, bottom: 6, color: '#fff', fontWeight: '700', fontSize: size * 0.2 }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
