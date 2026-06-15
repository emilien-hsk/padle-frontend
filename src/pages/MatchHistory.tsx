import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Match } from '../types';

function EloDelta({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const positive = delta > 0;
  return (
    <span style={{
      fontSize: '0.72rem',
      fontWeight: 700,
      color: positive ? 'var(--accent2)' : 'var(--danger)',
      background: positive ? 'rgba(74,222,128,0.1)' : 'rgba(255,77,77,0.1)',
      padding: '0.15rem 0.4rem',
      borderRadius: '5px',
    }}>
      {positive ? '+' : ''}{delta} ELO
    </span>
  );
}

export default function MatchHistory() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    api.get('/matches').then((r) => setMatches(r.data));
  }, []);

  function getTeamDelta(match: Match, teamPlayers: Match['teamA']): number | null {
    if (!match.eloChanges?.length) return null;
    const firstId = teamPlayers[0]?._id;
    const change = match.eloChanges.find((c) => c.playerId === firstId);
    return change?.delta ?? null;
  }

  return (
    <div className="page">
      <h1>Historique des matchs</h1>
      <div className="match-list">
        {matches.map((m) => {
          const deltaA = getTeamDelta(m, m.teamA);
          const deltaB = getTeamDelta(m, m.teamB);

          return (
            <div key={m._id} className="match-card">
              <div className="match-teams">
                <div className="team">
                  {m.teamA.map((p) => (
                    <Link key={p._id} to={`/players/${p._id}`}>{p.username}</Link>
                  ))}
                  {deltaA !== null && <EloDelta delta={deltaA} />}
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
                  {deltaB !== null && <EloDelta delta={deltaB} />}
                </div>
              </div>

              <div className="match-meta">
                <span className={`result-pill ${m.winner}`}>
                  {m.winner === 'teamA' ? 'Équipe A gagne' : m.winner === 'teamB' ? 'Équipe B gagne' : 'Match nul'}
                </span>
<span>{new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          );
        })}

        {matches.length === 0 && (
          <div className="empty-state">Aucun match enregistré pour l'instant.</div>
        )}
      </div>
    </div>
  );
}
