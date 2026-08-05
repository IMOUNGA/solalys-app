import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from './icon-symbol';

export function UpgradeRequired({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
        <IconSymbol name="lock.fill" size={36} color="#9CA3AF" />
      </View>
      <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
        Abonnement requis
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mb-5">{message}</Text>
      <Pressable
        onPress={() => router.push('/(tabs)/(compte)/abonnement' as any)}
        className="bg-green-500 rounded-full px-5 py-3 active:opacity-80"
      >
        <Text className="text-white font-bold text-sm">Voir les offres</Text>
      </Pressable>
    </View>
  );
}
