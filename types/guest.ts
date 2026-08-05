// Statuts "à venir" (avant l'événement, gérés par tout membre / la gouvernance sans condition de palier)
export const UPCOMING_GUEST_STATUSES = [
  { value: 'en_attente', label: 'En attente de validation', color: '#F59E0B' },
  { value: 'a_venir', label: 'Validé', color: '#3B82F6' },
] as const;

// Statuts "à suivre" (après passage, palier Pro+ requis)
export const GUEST_STATUSES = [
  { value: 'a_recontacter', label: 'À recontacter', color: '#F59E0B' },
  { value: 'recontacte', label: 'Recontacté', color: '#3B82F6' },
  { value: 'converti', label: 'Converti membre', color: '#10B981' },
  { value: 'pas_interesse', label: 'Pas intéressé', color: '#9CA3AF' },
] as const;

export type UpcomingGuestStatus = (typeof UPCOMING_GUEST_STATUSES)[number]['value'];
export type GuestStatus = (typeof GUEST_STATUSES)[number]['value'];

export interface GuestBroughtBy {
  id: number;
  firstname: string;
  lastname: string;
  avatar?: string | null;
}

export interface Guest {
  id: number;
  groupId: number;
  broughtByUserId: number;
  eventId?: number | null;
  firstname: string;
  lastname: string;
  email?: string | null;
  phone?: string | null;
  metier?: string | null;
  notes?: string | null;
  feedback?: string | null;
  visitDate?: string | null;
  status: UpcomingGuestStatus | GuestStatus;
  createdat: string;
  updatedat: string;
  broughtBy: GuestBroughtBy;
  event?: { id: number; name: string } | null;
}
