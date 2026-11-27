import React, { useMemo } from 'react';
import { View } from 'react-native';
import createQr from 'qrcode-generator';

interface Props {
  value: string;
  size: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * QR code dessiné avec des View (pas de module natif) : chaque ligne est
 * découpée en segments de cases de même couleur pour limiter le nombre de vues.
 */
export function QrCode({ value, size, color = '#111827', backgroundColor = '#FFFFFF' }: Props) {
  const rows = useMemo(() => {
    const qr = createQr(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    const lines: { dark: boolean; length: number }[][] = [];
    for (let r = 0; r < count; r++) {
      const segments: { dark: boolean; length: number }[] = [];
      for (let c = 0; c < count; c++) {
        const dark = qr.isDark(r, c);
        const last = segments[segments.length - 1];
        if (last && last.dark === dark) last.length += 1;
        else segments.push({ dark, length: 1 });
      }
      lines.push(segments);
    }
    return { count, lines };
  }, [value]);

  // Marge blanche de 4 cases autour du code (norme QR, nécessaire à la lecture).
  const cell = Math.floor(size / (rows.count + 8));
  const inner = cell * rows.count;
  return (
    <View
      style={{ width: inner + cell * 8, height: inner + cell * 8, padding: cell * 4, backgroundColor }}
      accessibilityLabel="QR code de présence"
    >
      {rows.lines.map((segments, r) => (
        <View key={r} style={{ flexDirection: 'row', height: cell }}>
          {segments.map((s, i) => (
            <View key={i} style={{ width: s.length * cell, height: cell, backgroundColor: s.dark ? color : backgroundColor }} />
          ))}
        </View>
      ))}
    </View>
  );
}
