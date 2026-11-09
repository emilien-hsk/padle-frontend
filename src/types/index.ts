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

export interface MatchVideo {
  videoId: string;
  addedBy: string;
  addedAt: string;
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
  video?: MatchVideo | null;
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

export interface TournamentMatch {
  teamAIndex: number;
  teamBIndex: number;
  status: 'pending' | 'completed';
  phase: 'pool' | 'final';
  poolIndex?: number;
  groupIndex?: number;
  matchId?: string;
  match?: Match | null;
}

export interface Tournament {
  _id: string;
  name: string;
  status: 'pool_stage' | 'playoffs' | 'completed';
  countForRanking: boolean;
  teams: { players: Player[] }[];
  pools: number[][];
  rankGroups: number[][];
  matches: TournamentMatch[];
  createdAt: string;
}

export interface StandRow {
  teamIdx: number;
  pts: number;
  setsFor: number;
  setsAgainst: number;
  gamesFor: number;
  gamesAgainst: number;
}

export const BADGE_LABELS: Record<string, { name: string; emoji: string; desc: string }> = {
  mercenaire: { name: 'Le Mercenaire', emoji: '⚔️', desc: 'Gagner avec 5 partenaires différents' },
  fidele:     { name: 'Le Fidèle',     emoji: '🤝', desc: '5 matchs consécutifs avec le même partenaire' },
  remontada:  { name: 'La Remontada',  emoji: '🔥', desc: 'Gagner un match après avoir subi un 6-0 au premier set' },
};

// ── Réservation (Playtomic) ──
export type CourtType = 'indoor' | 'covered' | 'outdoor';

export interface CourtSlot {
  start: string; // ISO UTC
  time: string; // "HH:MM" heure locale
  duration: number;
  price: number | null;
  priceLabel: string;
  bookingUrl: string;
}

export interface CourtAvailability {
  id: string;
  name: string;
  number: number;
  type: CourtType;
  slots: CourtSlot[];
}

export interface DayAvailability {
  date: string;
  clubUrl: string;
  fetchedAt: string;
  courts: CourtAvailability[];
}

export interface BookingClub {
  name: string;
  address: string;
  url: string;
  maxDaysAhead: number;
}

// ── Disponibilités & notifications ──
export interface PlayerLite {
  _id: string;
  username: string;
  elo: number;
}

export interface Availability {
  _id: string;
  player: PlayerLite;
  start: string;
  end: string;
}

export interface AvailabilityMatch {
  availabilityId: string;
  player: PlayerLite;
  start: string;
  end: string;
}

export interface MyAvailability {
  _id: string;
  channelId: string | null;
  start: string;
  end: string;
  matches: AvailabilityMatch[];
}

export interface AppNotification {
  _id: string;
  type: 'availability_match';
  title: string;
  body: string;
  url: string;
  read: boolean;
  createdAt: string;
}

// ── Canaux de discussion ──
export interface ChatProposal {
  start: string;
  duration: number;
  courtId?: string;
  courtNumber?: number;
  courtName?: string;
  bookingUrl?: string;
  votes: string[];
  status: 'open' | 'confirmed';
}

export interface ChatScorePrompt {
  proposal: string;
  start: string;
  duration: number;
  courtNumber?: number;
  status: 'pending' | 'recorded' | 'dismissed';
  matchId?: string;
  doneBy?: { _id: string; username: string };
}

/** Infos transmises de la discussion vers la saisie du score. */
export interface ScorePromptRef {
  channelId: string;
  messageId: string;
  label: string;
  members: PlayerLite[];
}

export interface ChatMessage {
  _id: string;
  author?: { _id: string; username: string };
  kind: 'text' | 'system' | 'proposal' | 'score_prompt';
  text: string;
  proposal?: ChatProposal;
  scorePrompt?: ChatScorePrompt;
  createdAt: string;
}

export interface ChannelSummary {
  _id: string;
  start: string;
  end: string;
  members: PlayerLite[];
  unread: number;
  nextMatch: NextMatch | null;
  lastMessage: { text: string; author?: { username: string }; createdAt: string } | null;
}

export interface ChannelDetail {
  _id: string;
  start: string;
  end: string;
  expiresAt: string;
  members: PlayerLite[];
  messages: ChatMessage[];
}

export interface NextMatch {
  start: string;
  duration: number;
  courtNumber?: number;
  courtName?: string;
  bookingUrl?: string;
}
