import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Player, Match } from '../types';

type Tab = 'players' | 'matches';

function ScoreEditor({ match, onSave, onCancel }: {
  match: Match;
  onSave: (scores: any[], winner: string) => void;
  onCancel: () => void;
}) {
  const [scores, setScores] = useState(match.scores.map((s) => ({ ...s })));
  const [winner, setWinner] = useState(match.winner);

  return (
    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginTop: '0.5rem' }}>
      {scores.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: 40 }}>Set {i + 1}</span>
          <input type="number" min={0} max={7} value={s.teamA_Score}
            onChange={(e) => setScores((prev) => prev.map((x, idx) => idx === i ? { ...x, teamA_Score: +e.target.value } : x))}
            style={{ width: 60, textAlign: 'center' }} />
          <span style={{ color: 'var(--text-muted)' }}>—</span>
          <input type="number" min={0} max={7} value={s.teamB_Score}
            onChange={(e) => setScores((prev) => prev.map((x, idx) => idx === i ? { ...x, teamB_Score: +e.target.value } : x))}
            style={{ width: 60, textAlign: 'center' }} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {(['teamA', 'draw', 'teamB'] as const).map((w) => (
          <button key={w} type="button" onClick={() => setWinner(w)}
            style={{ flex: 1, padding: '0.4rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
              background: winner === w ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${winner === w ? 'var(--accent)' : 'var(--border)'}`,
              color: winner === w ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer' }}>
            {w === 'teamA' ? 'A gagne' : w === 'teamB' ? 'B gagne' : 'Nul'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" onClick={() => onSave(scores, winner)}
          style={{ flex: 1, padding: '0.5rem', background: 'var(--accent)', color: '#0a0a0a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Sauvegarder
        </button>
        <button type="button" onClick={onCancel}
          style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const { player } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('players');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingElo, setEditingElo] = useState<string | null>(null);
  const [eloInput, setEloInput] = useState('');
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!player?.isAdmin) { navigate('/'); return; }
    loadAll();
  }, [player]);

  async function loadAll() {
    const [p, m] = await Promise.all([
      api.get('/admin/players'),
      api.get('/admin/matches'),
    ]);
    setPlayers(p.data);
    setMatches(m.data);
  }

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  }

  async function resetPlayer(id: string, name: string) {
    if (!confirm(`Réinitialiser le profil de ${name} ? (ELO → 1200, badges et séries effacés)`)) return;
    await api.post(`/admin/players/${id}/reset`);
    flash(`${name} réinitialisé.`);
    loadAll();
  }

  async function saveElo(id: string) {
    const elo = parseInt(eloInput);
    if (isNaN(elo)) return;
    await api.put(`/admin/players/${id}/elo`, { elo });
    setEditingElo(null);
    flash('ELO mis à jour.');
    loadAll();
  }

  async function deleteMatch(id: string) {
    if (!confirm('Supprimer ce match et annuler ses changements ELO ?')) return;
    await api.delete(`/admin/matches/${id}`);
    flash('Match supprimé.');
    loadAll();
  }

  async function saveMatch(id: string, scores: any[], winner: string) {
    await api.put(`/admin/matches/${id}`, { scores, winner });
    setEditingMatch(null);
    flash('Match mis à jour.');
    loadAll();
  }

  if (!player?.isAdmin) return null;

  return (
    <div className="page">
      <h1>Panneau Admin</h1>

      {msg && (
        <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.88rem', color: 'var(--accent2)' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['players', 'matches'] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 10, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
              background: tab === t ? 'var(--accent)' : 'var(--surface)',
              border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
              color: tab === t ? '#0a0a0a' : 'var(--text-muted)' }}>
            {t === 'players' ? 'Joueurs' : 'Matchs'}
          </button>
        ))}
      </div>

      {/* ── JOUEURS ── */}
      {tab === 'players' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {players.filter((p) => !p.isAdmin).map((p) => (
            <div key={p._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.9rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editingElo === p._id ? '0.75rem' : 0 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.username}</span>
                  {!p.isRegistered && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>invité</span>}
                  <span style={{ color: 'var(--accent)', fontWeight: 700, marginLeft: '0.75rem' }}>{p.elo} ELO</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="button" onClick={() => { setEditingElo(p._id); setEloInput(String(p.elo)); }}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: 7, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', cursor: 'pointer', fontWeight: 600 }}>
                    ELO
                  </button>
                  <button type="button" onClick={() => resetPlayer(p._id, p.username)}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: 7, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.25)', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600 }}>
                    Reset
                  </button>
                </div>
              </div>

              {editingElo === p._id && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" value={eloInput} onChange={(e) => setEloInput(e.target.value)}
                    style={{ width: 100 }} placeholder="Nouvel ELO" />
                  <button type="button" onClick={() => saveElo(p._id)}
                    style={{ padding: '0.4rem 0.75rem', background: 'var(--accent)', color: '#0a0a0a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                    OK
                  </button>
                  <button type="button" onClick={() => setEditingElo(null)}
                    style={{ padding: '0.4rem 0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── MATCHS ── */}
      {tab === 'matches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {matches.map((m) => (
            <div key={m._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.9rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {m.teamA.map((p) => p.username).join(' & ')} vs {m.teamB.map((p) => p.username).join(' & ')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {m.scores.map((s, i) => `${s.teamA_Score}-${s.teamB_Score}`).join(' ')}
                    {' · '}{new Date(m.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="button" onClick={() => setEditingMatch(editingMatch === m._id ? null : m._id)}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: 7, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', cursor: 'pointer', fontWeight: 600 }}>
                    Modifier
                  </button>
                  <button type="button" onClick={() => deleteMatch(m._id)}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: 7, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.25)', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600 }}>
                    Supprimer
                  </button>
                </div>
              </div>

              {editingMatch === m._id && (
                <ScoreEditor
                  match={m}
                  onSave={(scores, winner) => saveMatch(m._id, scores, winner)}
                  onCancel={() => setEditingMatch(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
