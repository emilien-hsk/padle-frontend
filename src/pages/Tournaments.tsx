import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Tournament } from '../types';
import { useAuth } from '../context/AuthContext';

const STATUS_LABEL = {
  pool_stage: { label: 'Phase de poules', color: '#fb923c' },
  playoffs: { label: 'Phase finale', color: '#60a5fa' },
  completed: { label: 'Terminé', color: 'var(--accent2)' },
};

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/tournaments').then((r) => setTournaments(r.data));
  }, []);

  return (
    <div className="page">
      <div className="leaderboard-header">
        <h1>Tournois</h1>
        {token && (
          <button
            type="button"
            onClick={() => navigate('/tournaments/new')}
            style={{
              padding: '0.45rem 1rem', background: 'var(--accent)', color: '#0a0a0a',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            + Nouveau
          </button>
        )}
      </div>

      {tournaments.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏆</div>
          <p>Aucun tournoi pour l'instant.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {tournaments.map((t) => {
          const s = STATUS_LABEL[t.status] ?? { label: t.status, color: 'var(--text-muted)' };
          const played = t.matches.filter((m) => m.status === 'completed').length;
          const total = t.matches.length;
          const pct = total > 0 ? Math.round((played / total) * 100) : 0;

          return (
            <Link
              key={t._id}
              to={`/tournaments/${t._id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '1rem 1.25rem', transition: 'border-color 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{t.name}</div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem',
                    borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: s.color,
                  }}>{s.label}</span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  {t.teams.length} équipes · {t.countForRanking ? 'ELO comptabilisé' : 'ELO non comptabilisé'}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  {played}/{total} matchs joués
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
