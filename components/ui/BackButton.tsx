import React from 'react';
import { Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from './icon-symbol';

/**
 * Bouton retour centralisé. Chaque tab a sa propre pile de navigation
 * (React Navigation) — sauter d'un tab à l'autre via router.push() démarre
 * une nouvelle pile dans le tab de destination, donc router.back() y
 * revient à l'écran racine de CE tab plutôt qu'à l'écran d'origine.
 *
 * Pour corriger ça : tout écran atteint via un saut de tab doit recevoir un
 * paramètre `returnTo` (le chemin de l'écran d'origine) au moment du push.
 * Ce bouton le lit et l'utilise en priorité ; sinon il se comporte comme un
 * retour classique.
 */
export function BackButton({
  variant = 'circle',
  color,
}: {
  variant?: 'circle' | 'plain';
  color?: string;
}) {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  const handlePress = () => {
    if (returnTo) {
      router.replace(returnTo as any);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)' as any);
  };

  if (variant === 'plain') {
    return (
      <Pressable onPress={handlePress} className="w-9 h-9 items-center justify-center -ml-2 active:opacity-70">
        <IconSymbol name="chevron.left" size={22} color={color ?? '#000'} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white rounded-full w-10 h-10 items-center justify-center active:bg-gray-100"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}
    >
      <IconSymbol name="chevron.left" size={22} color="#000" />
    </Pressable>
  );
}
