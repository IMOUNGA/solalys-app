export type NotificationType =
  | 'event_reminder'
  | 'guest_visit_reminder'
  | 'guest_followup_reminder'
  | 'guest_request_validated'
  | 'guest_request_rejected';

export interface AppNotification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: 'event' | 'guest_group' | null;
  entityId?: number | null;
  tab?: 'upcoming' | 'follow-up' | null;
  read: boolean;
  createdat: string;
}
