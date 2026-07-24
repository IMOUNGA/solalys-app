export type ReferralStatus = 'pending' | 'accepted' | 'converted' | 'declined';

export interface ReferralPerson {
  id: number;
  firstname: string;
  lastname: string;
  avatar?: string | null;
}

export interface NetworkContact {
  id: number;
  firstname: string;
  lastname: string;
  avatar?: string | null;
  metier?: string | null;
}

export interface Referral {
  id: number;
  groupId: number;
  fromUserId: number | null;
  toUserId: number;
  description: string;
  status: ReferralStatus;
  amount: number | null;
  createdat: string;
  convertedat?: string | null;
  fromUser: ReferralPerson | null;
  toUser: ReferralPerson;
  group?: { id: number; name: string };
}

export interface RevenueDashboardGroupTotal {
  groupId: number;
  groupName: string;
  total: number;
}

export interface RevenueDashboardPersonTotal {
  userId: number | null;
  firstname: string;
  lastname: string;
  total: number;
}

export interface RevenueDashboard {
  total: number;
  byGroup: RevenueDashboardGroupTotal[];
  byPerson: RevenueDashboardPersonTotal[];
  entries: Referral[];
  availableYears: number[];
}
