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
  userId?: number;
  groupId?: number;
  images?: string[];
  latitude?: number;
  longitude?: number;
  seriesId?: number | null;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    avatar?: string | null;
  };
  group?: {
    id: number;
    name: string;
  };
  participants?: EventParticipant[];
}

export interface EventParticipant {
  id: number;
  eventId: number;
  userId: number;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    metier?: string | null;
    primaryGroup?: {
      id: number;
      name: string;
    } | null;
  };
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
