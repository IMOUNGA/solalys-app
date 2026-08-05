import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useConfirmAlert } from '@/hooks/useAlert';
import { apiService } from '@/services/apiService';
import { AppNotification } from '@/types/notification';
import { openNotificationTarget } from '@/lib/notificationLink';

const TYPE_ICON: Record<AppNotification['type'], { name: any; color: string }> = {
  event_reminder: { name: 'calendar', color: '#3B82F6' },
  guest_visit_reminder: { name: 'person.crop.circle.badge.plus', color: '#8B5CF6' },
  guest_followup_reminder: { name: 'hourglass', color: '#F59E0B' },
  guest_request_validated: { name: 'checkmark.circle.fill', color: '#10B981' },
  guest_request_rejected: { name: 'xmark.circle.fill', color: '#9CA3AF' },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "À l'instant";
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const swipeRefs = useRef<Map<number, Swipeable>>(new Map());
  const showConfirm = useConfirmAlert();

  const load = useCallback(async () => {
    try {
      const res = await apiService.notifications.getMine();
      setNotifications(res.data || []);
    } catch {
      // silencieux — écran non critique
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silencieux
    }
  };

  const handlePress = async (notification: AppNotification) => {
    if (selectMode) {
      toggleSelected(notification.id);
      return;
    }
    if (!notification.read) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      apiService.notifications.markRead(notification.id).catch(() => {});
    }
    openNotificationTarget(notification);
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === notifications.length ? new Set() : new Set(notifications.map((n) => n.id)),
    );
  };

  const handleDeleteOne = async (id: number) => {
    swipeRefs.current.get(id)?.close();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiService.notifications.remove(id);
    } catch {
      load();
    }
  };

  const handleDeleteSelected = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    showConfirm(
      `Supprimer ${ids.length} notification${ids.length > 1 ? 's' : ''} ?`,
      async () => {
        setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
        exitSelectMode();
        try {
          await apiService.notifications.removeMany(ids);
        } catch {
          load();
        }
      },
      'Supprimer',
      'Supprimer',
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Pressable
          onPress={() => (selectMode ? exitSelectMode() : router.back())}
          className="w-9 h-9 items-center justify-center -ml-2"
        >
          <IconSymbol name={selectMode ? 'xmark' : 'chevron.left'} size={22} color="#000" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">
          {selectMode ? `${selectedIds.size} sélectionnée${selectedIds.size > 1 ? 's' : ''}` : 'Notifications'}
        </Text>

        {selectMode ? (
          <View className="flex-row items-center gap-4">
            <Pressable onPress={toggleSelectAll} className="active:opacity-70">
              <Text className="text-xs font-semibold text-violet-500">
                {selectedIds.size === notifications.length ? 'Aucune' : 'Tout'}
              </Text>
            </Pressable>
            <Pressable onPress={handleDeleteSelected} disabled={selectedIds.size === 0} className="active:opacity-70">
              <IconSymbol name="trash" size={20} color={selectedIds.size === 0 ? '#D1D5DB' : '#EF4444'} />
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center gap-4">
            {unreadCount > 0 && (
              <Pressable onPress={handleMarkAllRead} className="active:opacity-70">
                <Text className="text-xs font-semibold text-violet-500">Tout lire</Text>
              </Pressable>
            )}
            {notifications.length > 0 && (
              <Pressable onPress={() => setSelectMode(true)} className="active:opacity-70">
                <Text className="text-xs font-semibold text-gray-500">Sélectionner</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
          renderItem={({ item }) => {
            const icon = TYPE_ICON[item.type] ?? { name: 'bell', color: '#6B7280' };
            const isSelected = selectedIds.has(item.id);

            const card = (
              <Pressable onPress={() => handlePress(item)} className="active:opacity-80">
                <View
                  className="flex-row items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-4"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                >
                  {selectMode && (
                    <View
                      className="w-5 h-5 rounded-full items-center justify-center border-2"
                      style={{ backgroundColor: isSelected ? '#8B5CF6' : 'transparent', borderColor: isSelected ? '#8B5CF6' : '#D1D5DB' }}
                    >
                      {isSelected && <IconSymbol name="checkmark" size={11} color="#fff" />}
                    </View>
                  )}
                  <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: `${icon.color}22` }}>
                    <IconSymbol name={icon.name} size={18} color={icon.color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5 mb-0.5">
                      {!item.read && <View className="w-2 h-2 rounded-full bg-violet-500" />}
                      <Text className="text-sm font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-600 dark:text-gray-300" numberOfLines={3}>
                      {item.body}
                    </Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(item.createdat)}</Text>
                  </View>
                </View>
              </Pressable>
            );

            if (selectMode) {
              return <View className="mb-2.5">{card}</View>;
            }

            return (
              <View className="mb-2.5">
                <Swipeable
                  ref={(ref) => {
                    if (ref) swipeRefs.current.set(item.id, ref);
                    else swipeRefs.current.delete(item.id);
                  }}
                  overshootRight={false}
                  renderRightActions={() => (
                    <Pressable
                      onPress={() => handleDeleteOne(item.id)}
                      className="bg-red-500 justify-center items-center ml-2 rounded-2xl active:opacity-80"
                      style={{ width: 72 }}
                    >
                      <IconSymbol name="trash" size={20} color="#fff" />
                    </Pressable>
                  )}
                >
                  {card}
                </Swipeable>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <View className="bg-white dark:bg-gray-900 rounded-full p-6 mb-4">
                <IconSymbol name="bell" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1 text-center">
                Aucune notification
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                Les rappels de réunion et les mises à jour sur vos invités apparaîtront ici
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
