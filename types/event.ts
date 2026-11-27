export interface Event {
  id: number;
  name: string;
  description?: string | null;
  hours: string;
  endTime?: string | null;
  city: string;
  country: string;
  adress?: string;
  link?: string;
  maxParticipants?: number | null;
  userId?: number | null;
  groupId?: number | null;
  images?: string[];
  latitude?: number;
  longitude?: number;
  seriesId?: number | null;
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
  };
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
