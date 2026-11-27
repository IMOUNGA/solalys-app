export interface GroupRole {
  id: number;
  groupId: number;
  userId: number;
  title: string;
  // Gère la présence (QR code, pointage) ; null = valeur par défaut selon l'intitulé.
  manageAttendance?: boolean | null;
  createdat: string;
  user: {
    id: number;
    firstname: string;
    lastname: string;
    avatar?: string | null;
  };
}

export interface GroupRevenueSummary {
  total: number;
  byYear: { year: number; total: number }[];
  byMonth: { month: number; total: number }[];
}

export const SUGGESTED_ROLE_TITLES = [
  'Président',
  'Vice-Président',
  'Secrétaire',
  'Trésorier',
  "Responsable comité d'adhésion",
  'Ambassadeur',
];
