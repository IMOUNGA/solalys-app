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
  // Rythme des réunions (séries actives) : dayOfWeek 0 = dimanche .. 6 = samedi.
  meetings?: { dayOfWeek: number; startTime: string }[];
  // null si le groupe ne publie pas ses chiffres et que l'on n'est pas membre.
  stats?: GroupStats | null;
  // Envoyé aux membres seulement : chiffres visibles des non-membres.
  publicStats?: boolean;
}

export interface GroupStats {
  // Arrondi au millier inférieur pour un non-membre (null sous 1 000 €).
  revenueTotal: number | null;
  // null pour un non-membre.
  revenueThisYear: number | null;
  revenueRounded: boolean;
  referralsThisMonth: number;
  convertedReferrals: number;
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
  publicStats?: boolean;
}

export interface UpdateGroupDTO extends Partial<CreateGroupDTO> {}

import { Event } from './event';
