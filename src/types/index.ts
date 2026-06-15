export interface Player {
  _id: string;
  username: string;
  email?: string;
  isRegistered: boolean;
  isAdmin: boolean;
  elo: number;
  badges: string[];
  currentStreak: number;
  bestStreak: number;
  createdAt: string;
}

export interface SetScore {
  teamA_Score: number;
  teamB_Score: number;
  isComplete: boolean;
}

export interface PlayerMatch extends Match {
  result: 'win' | 'loss' | 'draw';
}

export interface EloChange {
  playerId: string;
  delta: number;
}

export interface Match {
  _id: string;
  date: string;
  teamA: Player[];
  teamB: Player[];
  scores: SetScore[];
  winner: 'teamA' | 'teamB' | 'draw';
  coefficient: 0.5 | 1.0;
  validated: boolean;
  eloChanges: EloChange[];
}

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
  bestPartner: { id: string; name: string; winRate: number } | null;
  nemesis: { id: string; name: string; lossRate: number } | null;
}

export const BADGE_LABELS: Record<string, { name: string; emoji: string; desc: string }> = {
  mercenaire: { name: 'Le Mercenaire', emoji: '⚔️', desc: 'Gagner avec 5 partenaires différents' },
  fidele:     { name: 'Le Fidèle',     emoji: '🤝', desc: '5 matchs consécutifs avec le même partenaire' },
  remontada:  { name: 'La Remontada',  emoji: '🔥', desc: 'Gagner un match après avoir subi un 6-0 au premier set' },
};
