import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Player, BADGE_LABELS } from '../types';

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    api.get('/players').then((r) => setPlayers(r.data));
  }, []);

  return (
    <div className="page">
      <h1>Classement</h1>
      <ol className="leaderboard">
        {players.map((p, i) => (
          <li key={p._id} className="leaderboard-row">
            <span className="rank">#{i + 1}</span>
            <Link to={`/players/${p._id}`} className="username">{p.username}</Link>
            <span className="elo">{p.elo} pts</span>
            <span className="badges">
              {p.badges.map((b) => (
                <span key={b} title={BADGE_LABELS[b]?.desc}>{BADGE_LABELS[b]?.emoji}</span>
              ))}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
