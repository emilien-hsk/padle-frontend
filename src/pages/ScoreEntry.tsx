import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Player } from '../types';

interface SetScore { teamA: number; teamB: number; isComplete: boolean; }

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7];

function computeWinner(sets: SetScore[]): 'teamA' | 'teamB' | 'draw' {
  let wA = 0, wB = 0;
  for (const s of sets) {
    if (s.teamA > s.teamB) wA++;
    else if (s.teamB > s.teamA) wB++;
  }
  return wA > wB ? 'teamA' : wB > wA ? 'teamB' : 'draw';
}

function ScorePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="score-picker">
      {SCORES.map((n) => (
        <button
          key={n}
          type="button"
          className={`score-btn ${value === n ? 'active' : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function ScoreEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const { teamA: teamAIds, teamB: teamBIds } = (location.state || {}) as { teamA: string[]; teamB: string[] };

  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [sets, setSets] = useState<SetScore[]>([{ teamA: 0, teamB: 0, isComplete: true }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!teamAIds || !teamBIds) { navigate('/new-match'); return; }
    Promise.all([
      ...teamAIds.map((id) => api.get<Player>(`/players/${id}`).then((r) => r.data.player ?? r.data)),
      ...teamBIds.map((id) => api.get<Player>(`/players/${id}`).then((r) => r.data.player ?? r.data)),
    ]).then(([a1, a2, b1, b2]) => {
      setTeamAPlayers([a1, a2]);
      setTeamBPlayers([b1, b2]);
    });
  }, []);

  function updateSet(i: number, side: 'teamA' | 'teamB', val: number) {
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, [side]: val } : s));
  }

  function toggleInterrupted(i: number) {
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, isComplete: !s.isComplete } : s));
  }

  function addSet() {
    setSets((prev) => [...prev, { teamA: 0, teamB: 0, isComplete: true }]);
  }

  async function finish() {
    setSubmitting(true);
    setError('');
    const winner = computeWinner(sets);
    const scores = sets.map((s) => ({ teamA_Score: s.teamA, teamB_Score: s.teamB, isComplete: s.isComplete }));
    try {
      await api.post('/matches', { teamA: teamAIds, teamB: teamBIds, scores, winner });
      navigate('/matches');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
      setSubmitting(false);
    }
  }

  const winner = computeWinner(sets);
  const winnerLabel =
    winner === 'teamA' ? `${teamAPlayers.map((p) => p.username).join(' & ')} gagnent` :
    winner === 'teamB' ? `${teamBPlayers.map((p) => p.username).join(' & ')} gagnent` :
    'Match nul';
  const winnerColor = winner === 'draw' ? 'var(--text-muted)' : 'var(--accent2)';

  const nameA = teamAPlayers.map((p) => p.username).join(' & ') || 'Équipe A';
  const nameB = teamBPlayers.map((p) => p.username).join(' & ') || 'Équipe B';

  return (
    <div className="page">
      <h1>Saisie des scores</h1>

      {/* Scoreboard live */}
      <div className="scoreboard">
        <div className="scoreboard-team">
          <div className="sb-name">{nameA}</div>
          <div className="sb-total">{sets.reduce((a, s) => a + (s.teamA > s.teamB ? 1 : 0), 0)}</div>
        </div>
        <div className="sb-sep">sets</div>
        <div className="scoreboard-team right">
          <div className="sb-name">{nameB}</div>
          <div className="sb-total">{sets.reduce((a, s) => a + (s.teamB > s.teamA ? 1 : 0), 0)}</div>
        </div>
      </div>

      {/* Sets */}
      {sets.map((s, i) => (
        <div key={i} className="set-card">
          <div className="set-card-header">
            <span className="set-card-label">Set {i + 1}</span>
            <button
              type="button"
              className={`interrupted-btn ${!s.isComplete ? 'active' : ''}`}
              onClick={() => toggleInterrupted(i)}
            >
              {s.isComplete ? 'Set complet' : 'Interrompu ⚡'}
            </button>
          </div>

          <div className="set-sides">
            <div className="set-side">
              <div className="side-label">{teamAPlayers[0]?.username ?? 'A'}</div>
              <div className="side-score">{s.teamA}</div>
              <ScorePicker value={s.teamA} onChange={(v) => updateSet(i, 'teamA', v)} />
            </div>

            <div className="set-divider">—</div>

            <div className="set-side">
              <div className="side-label">{teamBPlayers[0]?.username ?? 'B'}</div>
              <div className="side-score">{s.teamB}</div>
              <ScorePicker value={s.teamB} onChange={(v) => updateSet(i, 'teamB', v)} />
            </div>
          </div>
        </div>
      ))}

      {/* Résultat calculé */}
      <div className="winner-preview" style={{ color: winnerColor }}>
        {winnerLabel}
      </div>

      {error && <p className="error">{error}</p>}

      {/* Actions */}
      <div className="score-actions">
        {sets.length < 3 && (
          <button type="button" className="btn-secondary" onClick={addSet}>
            + Ajouter un set
          </button>
        )}
        <button
          type="button"
          className="btn-primary"
          onClick={finish}
          disabled={submitting}
        >
          {submitting ? 'Enregistrement...' : 'Terminer le match'}
        </button>
      </div>
    </div>
  );
}
