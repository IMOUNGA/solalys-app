export interface WeeklyAskAuthor {
  id: number;
  firstname: string;
  lastname: string;
  avatar?: string | null;
  metier?: string | null;
}

export interface WeeklyAsk {
  id: number;
  groupId: number;
  userId: number;
  content: string;
  weekof: string;
  createdat: string;
  updatedat: string;
  user: WeeklyAskAuthor;
}
