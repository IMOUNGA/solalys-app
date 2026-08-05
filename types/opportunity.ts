export const OPPORTUNITY_TYPES = [
  { value: 'prestataire', label: 'Prestataire', icon: 'wrench.fill' },
  { value: 'levee_fonds', label: 'Levée de fonds', icon: 'chart.line.uptrend.xyaxis' },
  { value: 'partenariat', label: 'Partenariat', icon: 'handshake.fill' },
  { value: 'recrutement', label: 'Recrutement', icon: 'person.badge.plus' },
  { value: 'autre', label: 'Autre', icon: 'ellipsis.circle.fill' },
] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number]['value'];

export interface OpportunityAuthor {
  id: number;
  firstname: string;
  lastname: string;
  avatar?: string | null;
  metier?: string | null;
}

export interface OpportunityGroup {
  id: number;
  name: string;
}

export interface Opportunity {
  id: number;
  groupId: number;
  userId: number;
  group?: OpportunityGroup;
  type: OpportunityType;
  title: string;
  description: string;
  status: 'open' | 'closed';
  createdat: string;
  closedat?: string | null;
  user: OpportunityAuthor;
  interestCount: number;
  interestedByMe: boolean;
  interests?: OpportunityAuthor[];
}
