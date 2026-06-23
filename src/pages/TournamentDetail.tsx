import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Tournament, TournamentMatch, Player, StandRow } from '../types';
import { useAuth } from '../context/AuthContext';

interface SetScore { teamA: number; teamB: number; isComplete: boolean; }
const SCORES = [0, 1, 2, 3, 4, 5, 6, 7];

type View = 'pools' | 'finals' | 'ranking';

function ScorePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="score-picker">
      {SCORES.map((n) => (
        <button key={n} type="button" className={`score-btn ${value === n ? 'active' : ''}`} onClick={() => onChange(n)}>{n}</button>
      ))}
    </div>
  );
}

function computeWinner(sets: SetScore[]): 'teamA' | 'teamB' | 'draw' {
  let wA = 0, wB = 0;
  for (const s of sets) { if (s.teamA > s.teamB) wA++; else if (s.teamB > s.teamA) wB++; }
  return wA > wB ? 'teamA' : wB > wA ? 'teamB' : 'draw';
}

const STATUS_LABEL = {
  pool_stage: { label: 'Phase de poules', color: '#fb923c' },
  playoffs: { label: 'Phase finale', color: '#60a5fa' },
  completed: { label: 'Terminé', color: 'var(--accent2)' },
};

function StandingsTable({ rows, teamName }: { rows: StandRow[]; teamName: (i: number) => string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 36px 60px', padding: '0.45rem 0.85rem', borderBottom: '1px solid var(--border)' }}>
        {['#', 'Équipe', 'Pts', 'Jeux'].map((h) => (
          <span key={h} style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{h}</span>
        ))}
      </div>
      {rows.map((row, rank) => (
        <div key={row.teamIdx} style={{
          display: 'grid', gridTemplateColumns: '28px 1fr 36px 60px', padding: '0.55rem 0.85rem',
          borderBottom: rank < rows.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.78rem', color: rank === 0 ? 'var(--accent)' : 'var(--text-muted)' }}>#{rank + 1}</span>
          <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text)' }}>{teamName(row.teamIdx)}</span>
          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent)' }}>{row.pts}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.gamesFor}-{row.gamesAgainst}</span>
        </div>
      ))}
    </div>
  );
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matchesWithData, setMatchesWithData] = useState<TournamentMatch[]>([]);
  const [poolStandings, setPoolStandings] = useState<StandRow[][]>([]);
  const [rankGroupStandings, setRankGroupStandings] = useState<StandRow[][]>([]);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [sets, setSets] = useState<SetScore[]>([{ teamA: 0, teamB: 0, isComplete: true }]);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<View>('pools');
  const prevStatus = useRef<string | null>(null);

  async function load() {
    const { data } = await api.get(`/tournaments/${id}`);
    setTournament(data.tournament);
    setMatchesWithData(data.matchesWithData);
    setPoolStandings(data.poolStandings);
    setRankGroupStandings(data.rankGroupStandings);

    const newStatus = data.tournament.status;
    if (prevStatus.current !== newStatus) {
      if (newStatus === 'playoffs') setView('finals');
      else if (newStatus === 'completed') setView('ranking');
      else setView('pools');
      prevStatus.current = newStatus;
    }
  }

  useEffect(() => { load(); }, [id]);

  function startMatch(idx: number) {
    setPlayingIdx(idx);
    setSets([{ teamA: 0, teamB: 0, isComplete: true }]);
  }

  function updateSet(i: number, side: 'teamA' | 'teamB', val: number) {
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, [side]: val } : s));
  }

  async function submitScore() {
    if (playingIdx === null) return;
    setSubmitting(true);
    const winner = computeWinner(sets);
    const scores = sets.map((s) => ({ teamA_Score: s.teamA, teamB_Score: s.teamB, isComplete: s.isComplete }));
    await api.post(`/tournaments/${id}/matches/${playingIdx}`, { scores, winner });
    setPlayingIdx(null);
    setSubmitting(false);
    load();
  }

  if (!tournament) return <div className="page" style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '4rem' }}>Chargement...</div>;

  const teamName = (idx: number) => tournament.teams[idx]?.players.map((p: Player) => p.username).join(' & ') ?? `Équipe ${idx + 1}`;
  const played = matchesWithData.filter((m) => m.status === 'completed').length;
  const total = matchesWithData.length;
  const s = STATUS_LABEL[tournament.status];
  const hasFinals = tournament.status !== 'pool_stage';
  const isCompleted = tournament.status === 'completed';

  function MatchCard({ m, idx }: { m: TournamentMatch; idx: number }) {
    const nameA = teamName(m.teamAIndex);
    const nameB = teamName(m.teamBIndex);
    const isPlaying = playingIdx === idx;

    return (
      <div style={{
        background: 'var(--surface)', border: `1px solid ${isPlaying ? 'rgba(200,241,53,0.3)' : 'var(--border)'}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '0.75rem 0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: m.status === 'completed' && m.match?.winner === 'teamA' ? 'var(--accent)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameA}</div>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: m.status === 'completed' && m.match?.winner === 'teamB' ? 'var(--accent)' : 'var(--text)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameB}</div>
            </div>

            {m.status === 'completed' && m.match ? (
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                {m.match.scores.map((sc, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)' }}>{sc.teamA_Score} — {sc.teamB_Score}</div>
                ))}
              </div>
            ) : token ? (
              <button type="button" onClick={() => isPlaying ? setPlayingIdx(null) : startMatch(idx)} style={{
                padding: '0.35rem 0.75rem', borderRadius: 8, fontWeight: 600, fontSize: '0.78rem',
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                background: isPlaying ? 'var(--danger-dim)' : 'var(--accent-dim)',
                border: `1px solid ${isPlaying ? 'rgba(255,77,77,0.3)' : 'rgba(200,241,53,0.3)'}`,
                color: isPlaying ? 'var(--danger)' : 'var(--accent)',
              }}>
                {isPlaying ? 'Annuler' : 'Jouer'}
              </button>
            ) : (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>À jouer</span>
            )}
          </div>
        </div>

        {isPlaying && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '1rem' }}>
            {sets.map((set, i) => (
              <div key={i} className="set-card" style={{ marginBottom: '0.75rem' }}>
                <div className="set-card-header">
                  <span className="set-card-label">Set {i + 1}</span>
                  <button type="button" className={`interrupted-btn ${!set.isComplete ? 'active' : ''}`}
                    onClick={() => setSets((prev) => prev.map((x, xi) => xi === i ? { ...x, isComplete: !x.isComplete } : x))}>
                    {set.isComplete ? 'Complet' : 'Interrompu'}
                  </button>
                </div>
                <div className="set-sides">
                  <div className="set-side">
                    <div className="side-label">{nameA}</div>
                    <div className="side-score">{set.teamA}</div>
                    <ScorePicker value={set.teamA} onChange={(v) => updateSet(i, 'teamA', v)} />
                  </div>
                  <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />
                  <div className="set-side">
                    <div className="side-label">{nameB}</div>
                    <div className="side-score">{set.teamB}</div>
                    <ScorePicker value={set.teamB} onChange={(v) => updateSet(i, 'teamB', v)} />
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {sets.length < 3 && (
                <button type="button" className="btn-secondary" style={{ flex: 1 }}
                  onClick={() => setSets((prev) => [...prev, { teamA: 0, teamB: 0, isComplete: true }])}>
                  + Set
                </button>
              )}
              <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={submitScore} disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Valider le score'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <button type="button" onClick={() => navigate('/tournaments')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>←</button>
        <h1 style={{ marginBottom: 0 }}>{tournament.name}</h1>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: s.color, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.6rem' }}>{s.label}</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.6rem' }}>{tournament.teams.length} équipes</span>
        <span style={{ fontSize: '0.78rem', color: tournament.countForRanking ? 'var(--accent)' : 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.6rem' }}>{tournament.countForRanking ? 'ELO comptabilisé' : 'ELO non comptabilisé'}</span>
        <span style={{ fontSize: '0.78rem', color: '#fb923c', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.6rem' }}>{played}/{total} matchs</span>
      </div>

      {/* ── ONGLETS ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button type="button" onClick={() => setView('pools')} style={{
          flex: 1, padding: '0.55rem', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
          background: view === 'pools' ? 'var(--accent)' : 'var(--surface)',
          border: `1px solid ${view === 'pools' ? 'var(--accent)' : 'var(--border)'}`,
          color: view === 'pools' ? '#0a0a0a' : 'var(--text-muted)',
        }}>
          Poules
        </button>
        <button type="button" disabled={!hasFinals} onClick={() => setView('finals')} style={{
          flex: 1, padding: '0.55rem', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem',
          cursor: hasFinals ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: hasFinals ? 1 : 0.4,
          background: view === 'finals' ? 'var(--accent)' : 'var(--surface)',
          border: `1px solid ${view === 'finals' ? 'var(--accent)' : 'var(--border)'}`,
          color: view === 'finals' ? '#0a0a0a' : 'var(--text-muted)',
        }}>
          Finale
        </button>
        <button type="button" disabled={!isCompleted} onClick={() => setView('ranking')} style={{
          flex: 1, padding: '0.55rem', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem',
          cursor: isCompleted ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: isCompleted ? 1 : 0.4,
          background: view === 'ranking' ? 'var(--accent)' : 'var(--surface)',
          border: `1px solid ${view === 'ranking' ? 'var(--accent)' : 'var(--border)'}`,
          color: view === 'ranking' ? '#0a0a0a' : 'var(--text-muted)',
        }}>
          Classement
        </button>
      </div>

      {/* ── VUE POULES ── */}
      {view === 'pools' && tournament.pools.map((pool, poolIdx) => (
        <div key={poolIdx} style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '0.5rem' }}>
            Poule {poolIdx + 1}
          </div>
          <div style={{ marginBottom: '0.6rem' }}>
            <StandingsTable rows={poolStandings[poolIdx] || []} teamName={teamName} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {matchesWithData.map((m, idx) => (m.phase === 'pool' && m.poolIndex === poolIdx) ? (
              <MatchCard key={idx} m={m} idx={idx} />
            ) : null)}
          </div>
        </div>
      ))}

      {/* ── VUE FINALE ── */}
      {view === 'finals' && hasFinals && tournament.rankGroups.map((group, groupIdx) => {
        if (group.length === 0) return null;
        const startPlace = tournament.rankGroups.slice(0, groupIdx).reduce((acc, g) => acc + g.length, 0) + 1;
        const endPlace = startPlace + group.length - 1;
        const label = startPlace === endPlace ? `Place ${startPlace}` : `Places ${startPlace}-${endPlace}`;
        const isTop = groupIdx === 0;

        return (
          <div key={groupIdx} style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isTop ? 'var(--accent)' : 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {isTop ? '🏆 ' : ''}{label}
            </div>
            {group.length >= 2 ? (
              <>
                <div style={{ marginBottom: '0.6rem' }}>
                  <StandingsTable rows={rankGroupStandings[groupIdx] || []} teamName={teamName} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {matchesWithData.map((m, idx) => (m.phase === 'final' && m.groupIndex === groupIdx) ? <MatchCard key={idx} m={m} idx={idx} /> : null)}
                </div>
              </>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.7rem 0.9rem', fontWeight: 600, fontSize: '0.85rem' }}>
                {teamName(group[0])}
              </div>
            )}
          </div>
        );
      })}

      {/* ── VUE CLASSEMENT FINAL ── */}
      {view === 'ranking' && isCompleted && (
        <>
          <div style={{ textAlign: 'center', padding: '1.25rem', background: 'var(--accent-dim)', border: '1px solid rgba(200,241,53,0.3)', borderRadius: 14, marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🏆</div>
            <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
              {rankGroupStandings[0]?.[0] ? teamName(rankGroupStandings[0][0].teamIdx) : ''} remporte le tournoi !
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {tournament.rankGroups.flatMap((group, groupIdx) => {
              const startPlace = tournament.rankGroups.slice(0, groupIdx).reduce((acc, g) => acc + g.length, 0) + 1;
              const ranked = group.length >= 2 ? rankGroupStandings[groupIdx]?.map((r) => r.teamIdx) ?? group : group;
              return ranked.map((teamIdx, i) => (
                <div key={`${groupIdx}-${teamIdx}`} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: startPlace + i === 1 ? 'var(--accent-dim)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${startPlace + i === 1 ? 'rgba(200,241,53,0.4)' : 'var(--border-light)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: startPlace + i === 1 ? 'var(--accent)' : 'var(--text-muted)',
                  }}>{startPlace + i}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{teamName(teamIdx)}</span>
                </div>
              ));
            })}
          </div>
        </>
      )}
    </div>
  );
}
