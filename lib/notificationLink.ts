import { router } from 'expo-router';

export interface NotificationLinkData {
  entityType?: 'event' | 'guest_group' | null;
  entityId?: number | string | null;
  tab?: 'upcoming' | 'follow-up' | null;
}

/**
 * Résout la destination d'une notification (in-app ou push tapée) vers un
 * écran de l'app — partagé entre le centre de notifications et le
 * listener de tap sur push, pour que les deux ouvrent exactement le même écran.
 */
export function openNotificationTarget(data: NotificationLinkData) {
  const entityId = data.entityId != null ? String(data.entityId) : null;
  if (!entityId) return;

  if (data.entityType === 'event') {
    router.push(`/(tabs)/(trouver)/${entityId}` as any);
    return;
  }

  if (data.entityType === 'guest_group') {
    const tab = data.tab === 'follow-up' ? 'follow-up' : 'upcoming';
    router.push(`/(tabs)/(groupes)/${entityId}/invites?tab=${tab}` as any);
  }
}
