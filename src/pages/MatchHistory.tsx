import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Match } from '../types';

export default function MatchHistory() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    api.get('/matches').then((r) => setMatches(r.data));
  }, []);

  return (
    <div className="page">
      <h1>Historique des matchs</h1>
      <div className="match-list">
        {matches.map((m) => (
          <div key={m._id} className="match-card">
            <div className="match-teams">
              <div className="team">
                {m.teamA.map((p) => (
                  <Link key={p._id} to={`/players/${p._id}`}>{p.username}</Link>
                ))}
              </div>
              <div className="match-score">
                {m.scores.map((s, i) => (
                  <span key={i} className={s.isComplete ? '' : 'partial'}>
                    {s.teamA_Score}–{s.teamB_Score}
                  </span>
                ))}
              </div>
              <div className="team">
                {m.teamB.map((p) => (
                  <Link key={p._id} to={`/players/${p._id}`}>{p.username}</Link>
                ))}
              </div>
            </div>

            <div className="match-meta">
              <span className={`result-pill ${m.winner}`}>
                {m.winner === 'teamA' ? 'Équipe A gagne' : m.winner === 'teamB' ? 'Équipe B gagne' : 'Match nul'}
              </span>
              <span className="coef-pill">×{m.coefficient}</span>
              <span>{new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        ))}

        {matches.length === 0 && (
          <div className="empty-state">Aucun match enregistré pour l'instant.</div>
        )}
      </div>
    </div>
  );
}
