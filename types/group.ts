export interface Group {
  id: number;
  name: string;
  creation?: string;
  country: string;
  city: string;
  adresse?: string;
  link?: string;
  slogan?: string;
  groupcreation?: string;
  groupcreator: number;
  creator?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
  groupMemberships?: GroupMembership[];
  events?: Event[];
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

export interface CreateGroupDTO {
  name: string;
  country: string;
  city: string;
  adresse?: string;
  link?: string;
  slogan?: string;
}

export interface UpdateGroupDTO extends Partial<CreateGroupDTO> {}

import { Event } from './event';
