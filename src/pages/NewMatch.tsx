import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Player } from '../types';

interface SetScore {
  teamA_Score: number;
  teamB_Score: number;
  isComplete: boolean;
}

export default function NewMatch() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamA, setTeamA] = useState<[string, string]>(['', '']);
  const [teamB, setTeamB] = useState<[string, string]>(['', '']);
  const [sets, setSets] = useState<SetScore[]>([{ teamA_Score: 0, teamB_Score: 0, isComplete: true }]);
  const [winner, setWinner] = useState<'teamA' | 'teamB' | 'draw'>('teamA');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/players').then((r) => setPlayers(r.data));
  }, []);

  async function addGuest() {
    if (!guestName.trim()) return;
    const { data } = await api.post('/players/guest', { username: guestName.trim() });
    setPlayers((prev) => [...prev, data]);
    setGuestName('');
  }

  function addSet() {
    setSets((prev) => [...prev, { teamA_Score: 0, teamB_Score: 0, isComplete: true }]);
  }

  function removeSet(i: number) {
    setSets((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSet(i: number, field: keyof SetScore, value: number | boolean) {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const allPlayers = [teamA[0], teamA[1], teamB[0], teamB[1]];
    if (allPlayers.some((p) => !p)) { setError('Sélectionnez 4 joueurs'); return; }
    if (new Set(allPlayers).size !== 4) { setError('Les joueurs doivent être différents'); return; }
    try {
      await api.post('/matches', { teamA, teamB, scores: sets, winner });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission');
    }
  }

  const playerOptions = players.map((p) => (
    <option key={p._id} value={p._id}>{p.username}{!p.isRegistered ? ' (invité)' : ''}</option>
  ));

  return (
    <div className="page">
      <h1>Nouveau match</h1>
      <form onSubmit={submit} className="match-form">

        <div className="teams-grid">
          <div className="team-block">
            <h3>Équipe A</h3>
            <select value={teamA[0]} onChange={(e) => setTeamA([e.target.value, teamA[1]])}>
              <option value="">— Joueur 1 —</option>
              {playerOptions}
            </select>
            <select value={teamA[1]} onChange={(e) => setTeamA([teamA[0], e.target.value])}>
              <option value="">— Joueur 2 —</option>
              {playerOptions}
            </select>
          </div>

          <div className="vs">VS</div>

          <div className="team-block">
            <h3>Équipe B</h3>
            <select value={teamB[0]} onChange={(e) => setTeamB([e.target.value, teamB[1]])}>
              <option value="">— Joueur 1 —</option>
              {playerOptions}
            </select>
            <select value={teamB[1]} onChange={(e) => setTeamB([teamB[0], e.target.value])}>
              <option value="">— Joueur 2 —</option>
              {playerOptions}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Ajouter un joueur invité</h3>
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

        <div className="form-section">
          <h3>Scores par set</h3>
          {sets.map((s, i) => (
            <div key={i} className="set-row">
              <span className="set-label">Set {i + 1}</span>
              <input type="number" min={0} max={7} value={s.teamA_Score}
                onChange={(e) => updateSet(i, 'teamA_Score', +e.target.value)} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>—</span>
              <input type="number" min={0} max={7} value={s.teamB_Score}
                onChange={(e) => updateSet(i, 'teamB_Score', +e.target.value)} />
              <label>
                <input type="checkbox" checked={!s.isComplete}
                  onChange={(e) => updateSet(i, 'isComplete', !e.target.checked)} />
                Interrompu
              </label>
              {sets.length > 1 && (
                <button type="button" onClick={() => removeSet(i)} style={{ padding: '0.3rem 0.6rem' }}>✕</button>
              )}
            </div>
          ))}
          {sets.length < 3 && (
            <button type="button" onClick={addSet} style={{ marginTop: '0.5rem' }}>+ Ajouter un set</button>
          )}
        </div>

        <div className="form-section">
          <h3>Résultat final</h3>
          <div className="result-options">
            {(['teamA', 'draw', 'teamB'] as const).map((w) => (
              <label key={w} className={`result-btn ${winner === w ? 'active' : ''}`}>
                <input type="radio" name="winner" value={w} checked={winner === w} onChange={() => setWinner(w)} />
                {w === 'teamA' ? 'Victoire A' : w === 'teamB' ? 'Victoire B' : 'Match Nul'}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary">Valider le match</button>
      </form>
    </div>
  );
}
