export interface Group {
  id: number;
  name: string;
  creation?: string;
  country: string;
  city: string;
  adresse?: string;
  link?: string;
  slogan?: string;
  images?: string[];
  groupcreation?: string;
  groupcreator: number;
  // Absent (null) pour un visiteur qui n'est pas membre du groupe.
  creator?: {
    id: number;
    firstname: string;
    lastname: string;
    avatar?: string | null;
  } | null;
  groupMemberships?: GroupMembership[];
  events?: Event[];
  memberCount?: number;
  isMember?: boolean;
}

export interface GroupMembership {
  id: number;
  userId: number;
  groupId: number;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    email?: string;
  };
}

export interface GroupMember {
  id: number;
  firstname: string;
  lastname: string;
  avatar?: string | null;
  metier?: string | null;
  offre?: string | null;
  recherche?: string | null;
  creation?: string;
  isCreator: boolean;
}

export interface CreateGroupDTO {
  name: string;
  country: string;
  city: string;
  adresse?: string;
  link?: string;
  slogan?: string;
  images?: string[];
}

export interface UpdateGroupDTO extends Partial<CreateGroupDTO> {}

import { Event } from './event';
