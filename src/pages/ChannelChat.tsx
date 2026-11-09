import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChannelDetail, ChatMessage, DayAvailability, ScorePromptRef } from '../types';
import { findFreeCourts, hm, loadDay, toIsoDate } from '../utils/courts';

const POLL_MS = 4000;
const DURATIONS = [60, 90, 120];

const dayShort = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

interface Pending {
  start: string; // ISO
  time: string;
  duration: number;
  courtId?: string;
  courtLabel?: string;
}

function errMsg(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
}

function ProposalCard({
  msg, channel, meId, onVote,
}: { msg: ChatMessage; channel: ChannelDetail; meId?: string; onVote: (id: string) => void }) {
  const p = msg.proposal!;
  const needed = Math.min(channel.members.length, 4);
  const iVoted = !!meId && p.votes.includes(meId);
  const end = new Date(new Date(p.start).getTime() + p.duration * 60000).toISOString();
  const voters = channel.members.filter((m) => p.votes.includes(m._id)).map((m) => m.username);
  const confirmed = p.status === 'confirmed';

  return (
    <div className={`proposal-card${confirmed ? ' confirmed' : ''}`}>
      <div className="proposal-label">
        {confirmed ? '✅ Horaire validé' : `📅 ${msg.author?.username ?? 'Un joueur'} propose`}
      </div>
      <div className="proposal-when">
        {hm(p.start)} – {hm(end)} <span>· {p.duration} min</span>
      </div>
      <div className="proposal-court">
        {p.courtNumber ? `Terrain ${p.courtNumber} · ${p.courtName}` : 'Terrain à choisir'}
      </div>
      <div className="proposal-votes">
        <span className={`players-pill${confirmed ? ' ok' : ''}`}>{p.votes.length}/{needed} OK</span>
        <span className="proposal-voters">{voters.join(', ')}</span>
      </div>
      <div className="proposal-actions">
        <button type="button" className={`vote-btn${iVoted ? ' on' : ''}`} onClick={() => onVote(msg._id)}>
          {iVoted ? '✓ Je suis OK' : 'Je suis OK'}
        </button>
        {confirmed && p.bookingUrl && (
          <a className="btn-primary booking-cta proposal-book" href={p.bookingUrl} target="_blank" rel="noopener noreferrer">
            Réserver sur Playtomic
          </a>
        )}
      </div>
      {confirmed && (
        <div className="proposal-note">
          {p.bookingUrl ? 'Une seule personne réserve, puis prévient les autres ici.' : 'Choisissez un terrain dans « Proposer un horaire ».'}
        </div>
      )}
    </div>
  );
}

function ScorePromptCard({
  msg, channel, onDismiss,
}: { msg: ChatMessage; channel: ChannelDetail; onDismiss: (id: string) => void }) {
  const navigate = useNavigate();
  const sp = msg.scorePrompt!;
  const end = new Date(new Date(sp.start).getTime() + sp.duration * 60000).toISOString();
  const label = `${dayShort(sp.start)} · ${hm(sp.start)}–${hm(end)}${sp.courtNumber ? ` · T${sp.courtNumber}` : ''}`;

  function addScore() {
    const ref: ScorePromptRef = { channelId: channel._id, messageId: msg._id, label, members: channel.members };
    navigate('/new-match', { state: { scorePrompt: ref } });
  }

  return (
    <div className={`score-prompt-card ${sp.status}`}>
      <div className="score-prompt-title">🎾 Match terminé</div>
      <div className="score-prompt-when">{label}</div>
      {sp.status === 'pending' && (
        <>
          <p className="score-prompt-text">Ajoute le score pour mettre la partie dans l'app et mettre à jour le classement. Un seul joueur s'en occupe.</p>
          <button type="button" className="btn-primary" onClick={addScore}>Ajouter le score</button>
          <button type="button" className="link-btn score-prompt-skip" onClick={() => onDismiss(msg._id)}>
            Ne pas enregistrer cette partie
          </button>
        </>
      )}
      {sp.status === 'recorded' && (
        <div className="score-prompt-done">
          ✅ Score enregistré{sp.doneBy ? ` par ${sp.doneBy.username}` : ''} · <Link to="/matches" className="inline-link">Voir le match</Link>
        </div>
      )}
      {sp.status === 'dismissed' && (
        <div className="score-prompt-done muted">Partie non enregistrée{sp.doneBy ? ` (${sp.doneBy.username})` : ''}</div>
      )}
    </div>
  );
}

export default function ChannelChat() {
  const { id } = useParams();
  const { player, token } = useAuth();
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [day, setDay] = useState<DayAvailability | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [freeTime, setFreeTime] = useState('');
  const [freeDuration, setFreeDuration] = useState(90);
  const [toast, setToast] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const load = useCallback(() => {
    if (!id) return;
    api.get(`/channels/${id}`)
      .then((r) => { setChannel(r.data); setError(null); })
      .catch((e) => setError(errMsg(e, 'Impossible de charger la discussion')));
  }, [id]);

  useEffect(() => {
    if (!token) return;
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    return () => clearInterval(t);
  }, [load, token]);

  // Défile en bas quand un nouveau message arrive
  useEffect(() => {
    const n = channel?.messages.length ?? 0;
    if (n > lastCount.current) bottomRef.current?.scrollIntoView({ behavior: lastCount.current ? 'smooth' : 'auto' });
    lastCount.current = n;
  }, [channel?.messages.length]);

  // Terrains libres sur la plage du canal
  useEffect(() => {
    if (!showPropose || !channel) return;
    loadDay(toIsoDate(new Date(channel.start))).then(setDay).catch(() => setDay(null));
  }, [showPropose, channel?.start]); // eslint-disable-line react-hooks/exhaustive-deps

  const free = useMemo(
    () => (day && channel ? findFreeCourts(day, new Date(channel.start), new Date(channel.end)) : null),
    [day, channel?.start, channel?.end] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Heures possibles pour une proposition sans terrain (pas de 30 min)
  const startTimes = useMemo(() => {
    if (!channel) return [] as { iso: string; label: string }[];
    const out: { iso: string; label: string }[] = [];
    const s = new Date(channel.start).getTime();
    const e = new Date(channel.end).getTime();
    for (let t = s; t + 60 * 60000 <= e; t += 30 * 60000) {
      if (t < Date.now()) continue;
      const iso = new Date(t).toISOString();
      out.push({ iso, label: hm(iso) });
    }
    return out;
  }, [channel?.start, channel?.end]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!freeTime && startTimes.length) setFreeTime(startTimes[0].iso);
  }, [startTimes, freeTime]);

  // Amène la barre « Envoyer » à l'écran quand on choisit un créneau
  useEffect(() => {
    if (pending) pendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [pending]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function send() {
    const t = text.trim();
    if (!t || !id) return;
    setSending(true);
    try {
      await api.post(`/channels/${id}/messages`, { text: t });
      setText('');
      load();
    } catch (e) {
      flash(errMsg(e, "Message non envoyé"));
    } finally {
      setSending(false);
    }
  }

  async function propose(p: Pending) {
    if (!id) return;
    try {
      await api.post(`/channels/${id}/proposals`, { start: p.start, duration: p.duration, courtId: p.courtId });
      setPending(null);
      setShowPropose(false);
      load();
    } catch (e) {
      flash(errMsg(e, 'Proposition impossible'));
    }
  }

  async function dismissScore(msgId: string) {
    if (!id) return;
    try {
      await api.post(`/channels/${id}/score-prompts/${msgId}/dismiss`);
      load();
    } catch (e) {
      flash(errMsg(e, 'Action impossible'));
      load();
    }
  }

  async function vote(msgId: string) {
    if (!id) return;
    try {
      await api.post(`/channels/${id}/proposals/${msgId}/vote`);
      load();
    } catch (e) {
      flash(errMsg(e, 'Vote impossible'));
    }
  }

  if (!token) {
    return (
      <div className="page">
        <div className="push-card">
          <div className="push-card-title">Connecte-toi pour accéder à la discussion</div>
          <Link to="/login" className="btn-primary booking-cta">Se connecter</Link>
        </div>
      </div>
    );
  }

  if (error && !channel) {
    return (
      <div className="page">
        <Link to="/channels" className="back-link">← Discussions</Link>
        <div className="empty-state">{error}</div>
      </div>
    );
  }

  if (!channel) return <div className="page"><div className="empty-state">Chargement…</div></div>;

  const others = channel.members.filter((m) => m._id !== player?._id);

  return (
    <div className="page chat-page">
      <div className="chat-head">
        <Link to="/channels" className="back-link">←</Link>
        <div className="chat-head-info">
          <div className="chat-title">{dayShort(channel.start)} · {hm(channel.start)}–{hm(channel.end)}</div>
          <div className="chat-members">
            Toi, {others.map((m) => m.username).join(', ')} · {Math.min(channel.members.length, 4)}/4
          </div>
        </div>
      </div>

      <button type="button" className="propose-toggle" onClick={() => setShowPropose((v) => !v)}>
        {showPropose ? 'Fermer' : '📅 Proposer un horaire'}
      </button>

      {showPropose && (
        <div className="propose-panel">
          <div className="propose-section-title">Terrains libres sur la plage</div>
          {!day ? (
            <div className="courts-box muted">Recherche des terrains libres…</div>
          ) : !free ? (
            <div className="courts-box none">Plus aucun terrain libre entre {hm(channel.start)}–{hm(channel.end)} 😕</div>
          ) : (
            <div className="courts-box">
              <div className="courts-box-title">{free.duration} min · touche un terrain pour le proposer</div>
              <div className="courts-times">
                {free.times.map((t) => (
                  <div key={t.time} className="courts-time-row">
                    <span className="courts-time">{t.time}</span>
                    <div className="courts-chips">
                      {t.courts.map(({ court, price }) => {
                        const slot = court.slots.find((s) => s.time === t.time && s.duration === free.duration);
                        if (!slot) return null;
                        const isSel = pending?.courtId === court.id && pending.time === t.time;
                        return (
                          <button
                            key={court.id}
                            type="button"
                            className={`court-chip ${court.type}${isSel ? ' selected' : ''}`}
                            onClick={() => setPending({
                              start: slot.start, time: t.time, duration: free.duration,
                              courtId: court.id, courtLabel: `Terrain ${court.number} · ${court.name} · ${price}`,
                            })}
                          >
                            T{court.number}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="propose-section-title">Ou juste un horaire</div>
          <div className="time-range">
            <label>
              <span>Début</span>
              <select value={freeTime} onChange={(e) => setFreeTime(e.target.value)}>
                {startTimes.map((t) => <option key={t.iso} value={t.iso}>{t.label}</option>)}
              </select>
            </label>
            <label>
              <span>Durée</span>
              <select value={freeDuration} onChange={(e) => setFreeDuration(Number(e.target.value))}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </label>
          </div>
          <button
            type="button"
            className="secondary-btn"
            disabled={!freeTime}
            onClick={() => setPending({ start: freeTime, time: hm(freeTime), duration: freeDuration })}
          >
            Proposer {freeTime ? hm(freeTime) : ''} · {freeDuration} min
          </button>

          {pending && (
            <div className="pending-bar" ref={pendingRef}>
              <div>
                <div className="pending-when">{pending.time} · {pending.duration} min</div>
                <div className="pending-court">{pending.courtLabel ?? 'Sans terrain'}</div>
              </div>
              <button className="btn-primary pending-send" onClick={() => propose(pending)}>Envoyer</button>
            </div>
          )}
        </div>
      )}

      <div className="chat-messages">
        {channel.messages.map((m) => {
          if (m.kind === 'system') {
            return <div key={m._id} className="chat-system">{m.text}</div>;
          }
          if (m.kind === 'score_prompt' && m.scorePrompt) {
            return (
              <div key={m._id} className="chat-row center">
                <ScorePromptCard msg={m} channel={channel} onDismiss={dismissScore} />
              </div>
            );
          }
          const mine = m.author?._id === player?._id;
          if (m.kind === 'proposal') {
            return (
              <div key={m._id} className={`chat-row${mine ? ' mine' : ''}`}>
                <ProposalCard msg={m} channel={channel} meId={player?._id} onVote={vote} />
              </div>
            );
          }
          return (
            <div key={m._id} className={`chat-row${mine ? ' mine' : ''}`}>
              <div className="chat-bubble">
                {!mine && <div className="chat-author">{m.author?.username}</div>}
                <div className="chat-text">{m.text}</div>
                <div className="chat-time">{hm(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {toast && <div className="chat-toast">{toast}</div>}

      <form
        className="chat-composer"
        onSubmit={(e) => { e.preventDefault(); send(); }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écris un message…"
          maxLength={500}
        />
        <button type="submit" className="send-btn" disabled={sending || !text.trim()} aria-label="Envoyer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
