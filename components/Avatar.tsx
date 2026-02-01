import React from 'react';
import { View, Text, Image, ViewStyle } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  style?: ViewStyle;
}

// Générer une couleur basée sur le nom (consistant)
const getColorFromName = (name: string): string => {
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  ];

  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

// Extraire les initiales (max 2 lettres)
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 40, style }) => {
  const hasImage = !!uri;
  const initials = getInitials(name);
  const backgroundColor = getColorFromName(name);
  const fontSize = size * 0.4;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: hasImage ? '#E5E7EB' : backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {hasImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={{
            color: '#FFFFFF',
            fontSize,
            fontWeight: '600',
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
};
