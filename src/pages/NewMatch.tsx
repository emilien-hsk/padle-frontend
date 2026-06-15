import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Player } from '../types';

export default function NewMatch() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamA, setTeamA] = useState<[string, string]>(['', '']);
  const [teamB, setTeamB] = useState<[string, string]>(['', '']);
  const [guestName, setGuestName] = useState('');
  const [pendingGuest, setPendingGuest] = useState<Player | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/players').then((r) => setPlayers(r.data));
  }, []);

  async function addGuest() {
    if (!guestName.trim()) return;
    const { data } = await api.post('/players/guest', { username: guestName.trim() });
    setPlayers((prev) => [...prev, data]);
    setGuestName('');
    setPendingGuest(data);
  }

  function assignToTeam(team: 'A' | 'B') {
    if (!pendingGuest) return;
    if (team === 'A') {
      const slot = teamA[0] === '' ? 0 : 1;
      setTeamA((prev) => { const t = [...prev] as [string,string]; t[slot] = pendingGuest._id; return t; });
    } else {
      const slot = teamB[0] === '' ? 0 : 1;
      setTeamB((prev) => { const t = [...prev] as [string,string]; t[slot] = pendingGuest._id; return t; });
    }
    setPendingGuest(null);
  }

  function start(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const all = [teamA[0], teamA[1], teamB[0], teamB[1]];
    if (all.some((p) => !p)) { setError('Sélectionnez 4 joueurs'); return; }
    if (new Set(all).size !== 4) { setError('Les joueurs doivent être différents'); return; }
    navigate('/match/score', { state: { teamA, teamB } });
  }

  function playerName(id: string) {
    return players.find((p) => p._id === id)?.username ?? '';
  }

  const opts = players.map((p) => (
    <option key={p._id} value={p._id}>{p.username}{!p.isRegistered ? ' (invité)' : ''}</option>
  ));

  return (
    <div className="page">
      <h1>Nouveau match</h1>

      {/* Popup assignation équipe */}
      {pendingGuest && (
        <div className="team-assign-overlay">
          <div className="team-assign-modal">
            <p style={{ marginBottom: '1rem', fontWeight: 600 }}>
              Dans quelle équipe joue <span style={{ color: 'var(--accent)' }}>{pendingGuest.username}</span> ?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="team-assign-btn" onClick={() => assignToTeam('A')}>
                Équipe A
              </button>
              <button type="button" className="team-assign-btn" onClick={() => assignToTeam('B')}>
                Équipe B
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={start} className="match-form">
        <div className="teams-grid">
          <div className="team-block">
            <h3>Équipe A</h3>
            {teamA[0] && <div className="selected-player">{playerName(teamA[0])}</div>}
            {!teamA[0] && (
              <select value="" onChange={(e) => setTeamA([e.target.value, teamA[1]])}>
                <option value="">— Joueur 1 —</option>{opts}
              </select>
            )}
            {teamA[0] && !teamA[1] && (
              <select value="" onChange={(e) => setTeamA([teamA[0], e.target.value])}>
                <option value="">— Joueur 2 —</option>{opts}
              </select>
            )}
            {teamA[1] && <div className="selected-player">{playerName(teamA[1])}</div>}
            {teamA[0] && (
              <button type="button" className="clear-team" onClick={() => setTeamA(['', ''])}>
                Modifier
              </button>
            )}
          </div>

          <div className="vs">VS</div>

          <div className="team-block">
            <h3>Équipe B</h3>
            {teamB[0] && <div className="selected-player">{playerName(teamB[0])}</div>}
            {!teamB[0] && (
              <select value="" onChange={(e) => setTeamB([e.target.value, teamB[1]])}>
                <option value="">— Joueur 1 —</option>{opts}
              </select>
            )}
            {teamB[0] && !teamB[1] && (
              <select value="" onChange={(e) => setTeamB([teamB[0], e.target.value])}>
                <option value="">— Joueur 2 —</option>{opts}
              </select>
            )}
            {teamB[1] && <div className="selected-player">{playerName(teamB[1])}</div>}
            {teamB[0] && (
              <button type="button" className="clear-team" onClick={() => setTeamB(['', ''])}>
                Modifier
              </button>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>
            Ajouter un joueur invité{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              (si pas de compte)
            </span>
          </h3>
          <div className="guest-section">
            <input
              placeholder="Nom du joueur invité..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGuest())}
            />
            <button type="button" onClick={addGuest}>+ Ajouter</button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary">Commencer le match →</button>
      </form>
    </div>
  );
}
