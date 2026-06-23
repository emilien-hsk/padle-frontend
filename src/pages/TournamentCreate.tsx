import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Player } from '../types';

type Team = [string, string];

export default function TournamentCreate() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [countForRanking, setCountForRanking] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [mode, setMode] = useState<'select' | 'teams'>('select');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    api.get('/players').then((r) =>
      setPlayers([...r.data].sort((a: Player, b: Player) =>
        a.username.localeCompare(b.username, undefined, { sensitivity: 'base' })
      ))
    );
  }, []);

  async function addGuest() {
    if (!guestName.trim()) return;
    const { data } = await api.post('/players/guest', { username: guestName.trim() });
    setPlayers((prev) => [...prev, data].sort((a, b) =>
      a.username.localeCompare(b.username, undefined, { sensitivity: 'base' })
    ));
    setSelected((prev) => [...prev, data._id]);
    setGuestName('');
  }

  function togglePlayer(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function randomizeTeams() {
    const shuffled = [...selected].sort(() => Math.random() - 0.5);
    const t: Team[] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      t.push([shuffled[i], shuffled[i + 1]]);
    }
    setTeams(t);
    setMode('teams');
  }

  function manualTeams() {
    const t: Team[] = [];
    for (let i = 0; i < selected.length; i += 2) {
      t.push([selected[i] || '', selected[i + 1] || '']);
    }
    setTeams(t);
    setMode('teams');
  }

  function setTeamPlayer(teamIdx: number, slot: 0 | 1, playerId: string) {
    setTeams((prev) => {
      const t = prev.map((team) => [...team] as Team);
      t[teamIdx][slot] = playerId;
      return t;
    });
  }

  function getName(id: string) {
    return players.find((p) => p._id === id)?.username ?? id;
  }

  async function submit() {
    setError('');
    if (!name.trim()) { setError('Donnez un nom au tournoi'); return; }
    if (teams.length < 2) { setError('Minimum 2 équipes'); return; }
    for (const t of teams) {
      if (!t[0] || !t[1]) { setError('Toutes les équipes doivent avoir 2 joueurs'); return; }
    }
    // Vérifier pas de doublon
    const allIds = teams.flat();
    if (new Set(allIds).size !== allIds.length) { setError('Un joueur ne peut pas être dans deux équipes'); return; }

    setSubmitting(true);
    try {
      const { data } = await api.post('/tournaments', {
        name: name.trim(),
        countForRanking,
        teams: teams.map((t) => ({ players: t })),
      });
      navigate(`/tournaments/${data._id}`);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur');
      setSubmitting(false);
    }
  }

  const playerOpts = players.map((p) => (
    <option key={p._id} value={p._id}>{p.username}</option>
  ));

  return (
    <div className="page">
      <h1>Nouveau tournoi</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Nom */}
        <div className="form-section">
          <h3>Nom du tournoi</h3>
          <input
            placeholder="Ex: Tournoi du samedi"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* ELO */}
        <div className="form-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Compter dans le classement ELO</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Les victoires affecteront les points ELO des joueurs
            </div>
          </div>
          <div
            onClick={() => setCountForRanking((v) => !v)}
            style={{
              width: 44, height: 26, borderRadius: 13, cursor: 'pointer', flexShrink: 0,
              background: countForRanking ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: countForRanking ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s',
            }} />
          </div>
        </div>

        {/* Sélection joueurs */}
        {mode === 'select' && (
          <div className="form-section">
            <h3>Sélectionner les joueurs ({selected.length} sélectionnés — doit être pair)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
              {players.map((p) => {
                const sel = selected.includes(p._id);
                return (
                  <div
                    key={p._id}
                    onClick={() => togglePlayer(p._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.65rem 0.75rem', borderRadius: 10, cursor: 'pointer',
                      background: sel ? 'var(--accent-dim)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${sel ? 'rgba(200,241,53,0.3)' : 'var(--border)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: sel ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', color: sel ? '#0a0a0a' : 'transparent', fontWeight: 700,
                    }}>✓</div>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem', color: sel ? 'var(--accent)' : 'var(--text)' }}>
                      {p.username}
                      {!p.isRegistered && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>invité</span>}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {p.elo} ELO
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Ajouter un invité */}
            <div style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
              <input
                placeholder="Nom d'un invité (si pas de compte)..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGuest())}
                style={{ flex: 1 }}
              />
              <button type="button" onClick={addGuest} style={{
                padding: '0.5rem 0.85rem', background: 'var(--surface)',
                border: '1px solid var(--border-light)', borderRadius: 10,
                color: 'var(--text-sub)', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                + Ajouter
              </button>
            </div>

            {selected.length >= 4 && selected.length % 2 === 0 && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={randomizeTeams} style={{
                  flex: 1, padding: '0.75rem', background: 'var(--accent)', color: '#0a0a0a',
                  border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Équipes aléatoires
                </button>
                <button type="button" onClick={manualTeams} style={{
                  flex: 1, padding: '0.75rem', background: 'var(--surface)',
                  border: '1px solid var(--border-light)', borderRadius: 10,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)',
                }}>
                  Choisir manuellement
                </button>
              </div>
            )}
            {selected.length > 0 && selected.length % 2 !== 0 && (
              <p style={{ color: '#fb923c', fontSize: '0.82rem' }}>
                Sélectionnez un nombre pair de joueurs
              </p>
            )}
          </div>
        )}

        {/* Configuration équipes manuelles */}
        {mode === 'teams' && (
          <div className="form-section">
            <h3>Équipes ({teams.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {teams.map((team, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '0.75rem',
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Équipe {i + 1}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select value={team[0]} onChange={(e) => setTeamPlayer(i, 0, e.target.value)} style={{ flex: 1 }}>
                      <option value="">— Joueur 1 —</option>
                      {playerOpts}
                    </select>
                    <select value={team[1]} onChange={(e) => setTeamPlayer(i, 1, e.target.value)} style={{ flex: 1 }}>
                      <option value="">— Joueur 2 —</option>
                      {playerOpts}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setMode('select')} style={{
              width: '100%', padding: '0.6rem', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 10,
              color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem',
            }}>
              Rechoisir les joueurs
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {mode === 'teams' && teams.length >= 2 && (
          <button type="button" className="btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Création...' : 'Créer le tournoi'}
          </button>
        )}
      </div>
    </div>
  );
}
