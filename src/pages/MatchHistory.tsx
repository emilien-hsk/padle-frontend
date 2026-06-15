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
          <div key={m._id} className={`match-card ${m.winner}`}>
            <div className="match-teams">
              <div className="team">
                {m.teamA.map((p) => <Link key={p._id} to={`/players/${p._id}`}>{p.username}</Link>)}
              </div>
              <div className="match-score">
                {m.scores.map((s, i) => (
                  <span key={i} className={s.isComplete ? '' : 'partial'}>
                    {s.teamA_Score}-{s.teamB_Score}
                  </span>
                ))}
              </div>
              <div className="team">
                {m.teamB.map((p) => <Link key={p._id} to={`/players/${p._id}`}>{p.username}</Link>)}
              </div>
            </div>
            <div className="match-meta">
              <span className={`result-label ${m.winner}`}>
                {m.winner === 'teamA' ? 'A gagne' : m.winner === 'teamB' ? 'B gagne' : 'Nul'}
              </span>
              <span className="coef">coef×{m.coefficient}</span>
              <span className="date">{new Date(m.date).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        ))}
        {matches.length === 0 && <p>Aucun match enregistré.</p>}
      </div>
    </div>
  );
}
