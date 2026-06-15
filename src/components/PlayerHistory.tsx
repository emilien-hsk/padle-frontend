import { Link } from 'react-router-dom';
import { PlayerMatch } from '../types';

const RESULT_CONFIG = {
  win:  { color: '#4ade80', label: 'V', bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.4)'  },
  loss: { color: '#f87171', label: 'D', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)' },
  draw: { color: '#fb923c', label: 'N', bg: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.4)'  },
  none: { color: '#475569', label: '·', bg: 'rgba(71,85,105,0.15)',   border: 'rgba(71,85,105,0.3)'   },
};

function Dot({ type }: { type: keyof typeof RESULT_CONFIG }) {
  const c = RESULT_CONFIG[type];
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: c.bg, border: `2px solid ${c.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.72rem', fontWeight: 800, color: c.color,
    }}>
      {c.label}
    </div>
  );
}

interface Props {
  history: PlayerMatch[];
  playerId: string;
}

export default function PlayerHistory({ history, playerId }: Props) {
  // 5 derniers matchs pour les pastilles (du plus ancien au plus récent)
  const last5 = [...history].slice(0, 5).reverse();
  const dots: (keyof typeof RESULT_CONFIG)[] = [
    ...Array(Math.max(0, 5 - last5.length)).fill('none'),
    ...last5.map((m) => m.result as keyof typeof RESULT_CONFIG),
  ];

  return (
    <div style={{ marginTop: '1rem' }}>

      {/* Pastilles 5 derniers matchs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>Historique</h3>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {dots.map((type, i) => <Dot key={i} type={type} />)}
        </div>
      </div>

      {/* Liste des matchs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {history.length === 0 && (
          <div className="empty-state">Aucun match joué.</div>
        )}
        {history.map((m) => {
          const isTeamA = m.teamA.some((p) => p._id === playerId);
          const myTeam = isTeamA ? m.teamA : m.teamB;
          const oppTeam = isTeamA ? m.teamB : m.teamA;
          const cfg = RESULT_CONFIG[m.result];

          return (
            <div key={m._id} style={{
              background: 'var(--surface)', border: `1px solid var(--border)`,
              borderLeft: `3px solid ${cfg.border}`,
              borderRadius: 12, padding: '0.75rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              {/* Résultat */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.68rem', fontWeight: 800, color: cfg.color,
              }}>
                {cfg.label}
              </div>

              {/* Équipes & score */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.2rem' }}>
                  {myTeam.map((p) => (
                    <Link key={p._id} to={`/players/${p._id}`}
                      style={{ color: p._id === playerId ? 'var(--accent)' : 'var(--text)', textDecoration: 'none', marginRight: '0.3rem' }}>
                      {p.username}
                    </Link>
                  ))}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs </span>
                  {oppTeam.map((p) => (
                    <Link key={p._id} to={`/players/${p._id}`}
                      style={{ color: 'var(--text-sub)', textDecoration: 'none', marginRight: '0.3rem' }}>
                      {p.username}
                    </Link>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                  {m.scores.map((s, i) => (
                    <span key={i} style={{ color: s.isComplete ? 'var(--text-muted)' : '#fb923c' }}>
                      {s.teamA_Score}–{s.teamB_Score}
                    </span>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                {new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
