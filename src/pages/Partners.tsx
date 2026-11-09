import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PlayTabs from '../components/PlayTabs';
import { disablePush, enablePush, getPushState, PushState } from '../services/push';
import { Availability, AvailabilityMatch, DayAvailability, MyAvailability } from '../types';
import { findFreeCourts, loadDay } from '../utils/courts';

const DAYS_SHOWN = 14;
const MIN_DURATION = 60;

// 07:00 → 23:30 par pas de 30 min
const TIMES = Array.from({ length: 34 }, (_, i) => {
  const total = 7 * 60 + i * 30;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
});

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextDays(count: number): Date[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

function atTime(day: string, time: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

const hm = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const dayLong = (iso: string) => {
  const s = new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const dayKey = (iso: string) => toIsoDate(new Date(iso));

// ── Terrains libres sur le créneau commun ──

interface PlayWindow { start: Date; end: Date; players: number }

/**
 * Plages communes d'au moins 1 h, de la plus peuplée (4 joueurs) à la moins (2).
 * Les plages des matches sont déjà limitées à mon créneau.
 */
function playWindows(matches: AvailabilityMatch[]): PlayWindow[] {
  const points = [...new Set(matches.flatMap((m) => [Date.parse(m.start), Date.parse(m.end)]))].sort((a, b) => a - b);
  const segments = points.slice(0, -1).map((from, i) => {
    const to = points[i + 1];
    const count = 1 + matches.filter((m) => Date.parse(m.start) <= from && Date.parse(m.end) >= to).length;
    return { from, to, count };
  });
  const maxCount = Math.min(4, Math.max(0, ...segments.map((s) => s.count)));
  const windows: PlayWindow[] = [];
  for (let k = maxCount; k >= 2; k--) {
    let best: { from: number; to: number } | null = null;
    let run: { from: number; to: number } | null = null;
    for (const seg of segments) {
      if (seg.count >= k) {
        run = run && run.to === seg.from ? { from: run.from, to: seg.to } : { from: seg.from, to: seg.to };
        if (!best || run.to - run.from > best.to - best.from) best = run;
      } else {
        run = null;
      }
    }
    if (best && best.to - best.from >= MIN_DURATION * 60000) {
      const w = { start: new Date(best.from), end: new Date(best.to), players: Math.min(k, 4) };
      const last = windows[windows.length - 1];
      if (!last || last.start.getTime() !== w.start.getTime() || last.end.getTime() !== w.end.getTime()) windows.push(w);
    }
  }
  return windows;
}

function CourtsForWindows({ windows }: { windows: PlayWindow[] }) {
  const [state, setState] = useState<{ loading: boolean; error: boolean; day: DayAvailability | null }>({
    loading: true, error: false, day: null,
  });
  const date = toIsoDate(windows[0].start);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: false, day: null });
    loadDay(date)
      .then((day) => { if (!cancelled) setState({ loading: false, error: false, day }); })
      .catch(() => { if (!cancelled) setState({ loading: false, error: true, day: null }); });
    return () => { cancelled = true; };
  }, [date]);

  // On prend la plage la plus peuplée qui a encore des terrains libres
  const found = useMemo(() => {
    if (!state.day) return null;
    for (const w of windows) {
      const r = findFreeCourts(state.day, w.start, w.end);
      if (r) return { window: w, ...r };
    }
    return null;
  }, [state.day, windows]);

  const top = windows[0];

  const fmt = (w: PlayWindow) => `${hm(w.start.toISOString())}–${hm(w.end.toISOString())}`;

  if (state.loading) return <div className="courts-box muted">Recherche des terrains libres…</div>;
  if (state.error) {
    return <div className="courts-box muted">Impossible de vérifier les terrains pour le moment.</div>;
  }
  if (!found) {
    return (
      <div className="courts-box none">
        Plus aucun terrain libre entre {fmt(top)} 😕
      </div>
    );
  }
  const result = found;

  return (
    <div className="courts-box">
      <div className="courts-box-title">
        Terrains libres entre {fmt(found.window)} · {found.duration} min
        {found.window.players < top.players && (
          <span className="courts-note"> (complet à {top.players} joueurs entre {fmt(top)}, ici {found.window.players} joueurs)</span>
        )}
      </div>
      <div className="courts-times">
        {result.times.map((t) => (
          <div key={t.time} className="courts-time-row">
            <span className="courts-time">{t.time}</span>
            <div className="courts-chips">
              {t.courts.map(({ court, url, price }) => (
                <a
                  key={court.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`court-chip ${court.type}`}
                  title={`Terrain ${court.number} · ${court.name} · ${price}`}
                >
                  T{court.number}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="courts-hint">Touche un terrain pour le réserver sur Playtomic</div>
    </div>
  );
}

function PushCard() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { getPushState().then(setState).catch(() => setState('unsupported')); }, []);

  async function toggle(on: boolean) {
    setBusy(true);
    setErr(null);
    try {
      setState(on ? await enablePush() : await disablePush());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Impossible d'activer les notifications");
    } finally {
      setBusy(false);
    }
  }

  if (!state || state === 'unsupported') return null;

  if (state === 'on') {
    return (
      <div className="push-on">
        <span>🔔 Notifications activées sur cet appareil</span>
        <button type="button" className="link-btn" onClick={() => toggle(false)} disabled={busy}>Désactiver</button>
      </div>
    );
  }

  return (
    <div className="push-card">
      <div className="push-card-title">Sois prévenu quand quelqu'un est dispo</div>
      {state === 'ios-install' ? (
        <p>Sur iPhone, les notifications ne marchent que si l'app est <strong>ajoutée à l'écran d'accueil</strong> (bouton <em>i</em> en haut à droite). Ouvre-la ensuite depuis l'icône et reviens ici.</p>
      ) : state === 'denied' ? (
        <p>Les notifications sont bloquées pour ce site. Autorise-les dans les réglages du navigateur, puis recharge la page.</p>
      ) : (
        <>
          <p>Reçois une notification dès qu'un joueur ajoute une dispo qui correspond à la tienne.</p>
          <button className="btn-primary" onClick={() => toggle(true)} disabled={busy}>
            {busy ? 'Activation…' : 'Activer les notifications'}
          </button>
        </>
      )}
      {err && <div className="error">{err}</div>}
    </div>
  );
}

export default function Partners() {
  const { token, player } = useAuth();
  const days = useMemo(() => nextDays(DAYS_SHOWN), []);
  const [day, setDay] = useState(() => toIsoDate(days[0]));
  const [from, setFrom] = useState('18:00');
  const [to, setTo] = useState('20:00');
  const [mine, setMine] = useState<MyAvailability[]>([]);
  const [all, setAll] = useState<Availability[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [newChannel, setNewChannel] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLElement>(null);

  // Arrivée depuis « + → Ajouter une dispo » : on amène le formulaire à l'écran
  useEffect(() => {
    if (searchParams.get('add')) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }, [searchParams]);

  const load = useCallback(() => {
    api.get('/availability').then((r) => setAll(r.data)).catch(() => {});
    if (token) api.get('/availability/mine').then((r) => setMine(r.data)).catch(() => {});
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function addAvailability(start: Date, end: Date) {
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await api.post('/availability', { start: start.toISOString(), end: end.toISOString() });
      const n: number = data.matchCount;
      setNewChannel(data.channelId ?? null);
      setMessage({
        kind: 'ok',
        text: n > 0
          ? `Dispo ajoutée ! ${n} joueur${n > 1 ? 's sont' : ' est'} dispo en même temps 🎾`
          : "Dispo ajoutée. Tu seras prévenu dès qu'un joueur est libre en même temps.",
      });
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setMessage({ kind: 'error', text: msg || "Impossible d'ajouter la dispo" });
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    if (minutesOf(to) - minutesOf(from) < MIN_DURATION) {
      setMessage({ kind: 'error', text: 'Le créneau doit durer au moins 1 h' });
      return;
    }
    addAvailability(atTime(day, from), atTime(day, to));
  }

  async function remove(id: string) {
    await api.delete(`/availability/${id}`).catch(() => {});
    load();
  }

  const others = all.filter((a) => a.player?._id !== player?._id);
  const othersByDay = useMemo(() => {
    const map = new Map<string, Availability[]>();
    for (const a of others) {
      const k = dayKey(a.start);
      map.set(k, [...(map.get(k) ?? []), a]);
    }
    return [...map.entries()];
  }, [others]);

  return (
    <div className="page partners-page">
      <PlayTabs />
      <h1>Dispos</h1>
      <p className="page-sub">Indique quand tu peux jouer : tu seras prévenu dès qu'un autre joueur est dispo au même moment (au moins 1 h en commun).</p>

      {!token ? (
        <div className="push-card">
          <div className="push-card-title">Connecte-toi pour ajouter tes dispos</div>
          <Link to="/login" className="btn-primary booking-cta">Se connecter</Link>
        </div>
      ) : (
        <>
          <PushCard />

          {/* Ajouter une dispo */}
          <section className="avail-form" ref={formRef}>
            <h3>Ajouter une dispo</h3>
            <div className="day-strip">
              {days.map((d, i) => {
                const iso = toIsoDate(d);
                const top = i === 0 ? 'Auj.' : i === 1 ? 'Dem.' : d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
                return (
                  <button key={iso} type="button" className={`day-chip${iso === day ? ' active' : ''}`} onClick={() => setDay(iso)}>
                    <span className="day-chip-top">{top}</span>
                    <span className="day-chip-num">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <div className="time-range">
              <label>
                <span>De</span>
                <select value={from} onChange={(e) => setFrom(e.target.value)}>
                  {TIMES.slice(0, -2).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>
                <span>À</span>
                <select value={to} onChange={(e) => setTo(e.target.value)}>
                  {TIMES.slice(2).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <button className="btn-primary" onClick={submit} disabled={busy}>
              {busy ? 'Ajout…' : 'Ajouter ma dispo'}
            </button>
            {message && (
              <div className={message.kind === 'ok' ? 'success-msg' : 'error'}>
                {message.text}
                {message.kind === 'ok' && newChannel && (
                  <> <Link to={`/channels/${newChannel}`} className="inline-link">Ouvrir la discussion →</Link></>
                )}
              </div>
            )}
          </section>

          {/* Mes dispos */}
          <section className="avail-section">
            <h3>Mes dispos</h3>
            {mine.length === 0 ? (
              <div className="empty-state">Tu n'as pas encore de dispo.</div>
            ) : (
              <div className="avail-list">
                {mine.map((a) => (
                  <div key={a._id} className={`avail-card${a.matches.length ? ' has-match' : ''}`}>
                    <div className="avail-card-head">
                      <div>
                        <div className="avail-day">{dayLong(a.start)}</div>
                        <div className="avail-time">{hm(a.start)} – {hm(a.end)}</div>
                      </div>
                      <div className="avail-card-actions">
                        <span className={`players-pill${a.matches.length ? ' ok' : ''}`}>
                          {Math.min(a.matches.length + 1, 4)}/4 joueurs
                        </span>
                        <button type="button" className="avail-del" onClick={() => remove(a._id)} aria-label="Supprimer">×</button>
                      </div>
                    </div>
                    {a.matches.length > 0 ? (
                      <>
                        <div className="match-people">
                          {a.matches.map((m) => (
                            <Link key={m.availabilityId} to={`/players/${m.player._id}`} className="person-chip">
                              <span className="person-name">{m.player.username}</span>
                              <span className="person-range">{hm(m.start)}–{hm(m.end)}</span>
                            </Link>
                          ))}
                        </div>
                        {(() => {
                          const windows = playWindows(a.matches);
                          return windows.length ? <CourtsForWindows windows={windows} /> : null;
                        })()}
                        {a.channelId && (
                          <Link to={`/channels/${a.channelId}`} className="btn-primary booking-cta open-chat">
                            💬 Ouvrir la discussion
                          </Link>
                        )}
                      </>
                    ) : (
                      <div className="avail-wait">En attente d'autres joueurs…</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Dispos des autres joueurs */}
      <section className="avail-section">
        <h3>Dispos des joueurs</h3>
        {othersByDay.length === 0 ? (
          <div className="empty-state">Personne n'a encore indiqué de dispo.</div>
        ) : (
          othersByDay.map(([k, list]) => (
            <div key={k} className="others-day">
              <div className="others-day-label">{dayLong(list[0].start)}</div>
              {list.map((a) => (
                <div key={a._id} className="other-row">
                  <Link to={`/players/${a.player._id}`} className="other-player">
                    <span className="other-name">{a.player.username}</span>
                    <span className="other-elo">{a.player.elo} ELO</span>
                  </Link>
                  <span className="other-time">{hm(a.start)} – {hm(a.end)}</span>
                  {token && (
                    <button
                      type="button"
                      className="join-btn"
                      disabled={busy}
                      onClick={() => addAvailability(new Date(a.start), new Date(a.end))}
                    >
                      Moi aussi
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
