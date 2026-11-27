export interface Event {
  id: number;
  name: string;
  description?: string | null;
  hours: string;
  endTime?: string | null;
  city: string;
  country: string;
  // null pour un visiteur ni membre du groupe ni inscrit : il ne voit que la ville.
  adress?: string | null;
  link?: string | null;
  maxParticipants?: number | null;
  userId?: number | null;
  groupId?: number | null;
  images?: string[];
  latitude?: number;
  longitude?: number;
  seriesId?: number | null;
  // Rythme de la série (hebdomadaire) : dayOfWeek 0 = dimanche .. 6 = samedi.
  series?: {
    id: number;
    dayOfWeek: number;
    startTime: string;
    active: boolean;
  } | null;
  // Auteur de la série, créateur ou président du groupe (calculé par le serveur).
  canManageSeries?: boolean;
  // Peut afficher le QR code de présence et pointer à la main (réunion de groupe).
  canManageAttendance?: boolean;
  // Ma présence à cette réunion (membres du groupe), null si rien d'enregistré.
  myAttendance?: {
    status: AttendanceStatus;
    checkedInAt: string | null;
    note: string | null;
  } | null;
  // Adresse, lien et position exacte masqués (position arrondie à ~1 km).
  detailsHidden?: boolean;
  // Organisateur : visible seulement des membres du groupe et des participants.
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    avatar?: string | null;
  } | null;
  group?: {
    id: number;
    name: string;
  } | null;
  participants?: EventParticipant[];
  participantCount?: number;
  distance?: number;
}

export type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';

export interface AttendanceSheet {
  event: { id: number; name: string; hours: string };
  opensAt: string;
  closesAt: string;
  finalized: boolean;
  canManage: boolean;
  summary: { present: number; late: number; excused: number; absent: number; unknown: number; total: number; guests: number };
  members: {
    user: { id: number; firstname: string; lastname: string; avatar?: string | null; metier?: string | null };
    status: AttendanceStatus | null;
    checkedInAt: string | null;
    note: string | null;
  }[];
  // Invités venus à la réunion (pointés sur place ou marqués venus).
  guests: { id: number; firstname: string; lastname: string; metier: string | null }[];
}

export interface EventParticipant {
  id: number;
  eventId: number;
  // null pour un visiteur qui n'est ni membre du groupe ni participant.
  userId: number | null;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    avatar?: string | null;
    metier?: string | null;
  } | null;
}

export interface CreateEventDTO {
  name: string;
  hours: string;
  city: string;
  country: string;
  adress?: string;
  link?: string;
  groupId?: number;
  latitude?: number;
  longitude?: number;
  images?: string[];
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {}
