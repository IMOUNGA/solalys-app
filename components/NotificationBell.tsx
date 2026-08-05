import React, { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService } from '@/services/apiService';
import { useAppSelector } from '@/hooks/useRedux';

export function NotificationBell({ color = '#fff' }: { color?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAppSelector((state) => state.auth);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      apiService.notifications
        .getUnreadCount()
        .then((res) => setUnreadCount(res.data ?? 0))
        .catch(() => {});
    }, [user]),
  );

  if (!user) return null;

  return (
    <Pressable onPress={() => router.push('/notifications' as any)} className="w-9 h-9 items-center justify-center active:opacity-70">
      <IconSymbol name="bell" size={22} color={color} />
      {unreadCount > 0 && (
        <View className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 items-center justify-center">
          <Text className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}
