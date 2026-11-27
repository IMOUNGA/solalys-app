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
