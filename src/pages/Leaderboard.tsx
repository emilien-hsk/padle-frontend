import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Player, BADGE_LABELS } from '../types';

const AVATAR_COLORS = ['av-0', 'av-1', 'av-2', 'av-3', 'av-4', 'av-5'];

function rankClass(i: number) {
  if (i === 0) return 'top1';
  if (i === 1) return 'top2';
  if (i === 2) return 'top3';
  return '';
}

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    api.get('/players').then((r) => setPlayers(r.data));
  }, []);

  return (
    <div className="page">
      <div className="leaderboard-header">
        <h1>Classement</h1>
        <span className="season-badge">Saison 2026</span>
      </div>

      <div className="leaderboard-table">
        <div className="leaderboard-cols">
          <span>Rang</span>
          <span>Joueur</span>
          <span style={{ textAlign: 'right' }}>ELO</span>
          <span style={{ textAlign: 'right' }}>Badges</span>
        </div>

        {players.map((p, i) => (
          <div key={p._id} className="leaderboard-row">
            <div className={`rank-badge ${rankClass(i)}`}>#{i + 1}</div>

            <Link to={`/players/${p._id}`} className="player-cell">
              <div className={`avatar-sm ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                {p.username[0].toUpperCase()}
              </div>
              <div>
                <div className="player-name">{p.username}</div>
                {!p.isRegistered && <div className="player-sub">Invité</div>}
              </div>
            </Link>

            <div className="elo-cell">{p.elo}</div>

            <div className="badges-cell">
              {p.badges.map((b) => (
                <span key={b} title={BADGE_LABELS[b]?.name}>{BADGE_LABELS[b]?.emoji}</span>
              ))}
            </div>
          </div>
        ))}

        {players.length === 0 && (
          <div className="empty-state">Aucun joueur enregistré.</div>
        )}
      </div>
    </div>
  );
}
