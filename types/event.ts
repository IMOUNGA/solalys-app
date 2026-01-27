export interface Event {
  id: number;
  name: string;
  hours: string;
  city: string;
  country: string;
  adress?: string;
  link?: string;
  userId?: number;
  groupId?: number;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
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
