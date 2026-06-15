export interface Player {
  _id: string;
  username: string;
  email?: string;
  isRegistered: boolean;
  elo: number;
  badges: string[];
  createdAt: string;
}

export interface SetScore {
  teamA_Score: number;
  teamB_Score: number;
  isComplete: boolean;
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
  fidele:     { name: 'Le Fidèle',     emoji: '🤝', desc: '10 matchs consécutifs avec le même partenaire' },
  remontada:  { name: 'La Remontada',  emoji: '🔥', desc: 'Gagner en 3 sets après un 6-0 au premier' },
};
