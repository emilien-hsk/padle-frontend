import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChannelSummary, MyAvailability, Player } from '../types';
import ChannelCard, { dayLabel, matchEnd, sortChannels } from '../components/ChannelCard';
import PendingClaims from '../components/PendingClaims';
import { hm } from '../utils/courts';

export default function Home() {
  const { token, player } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [mine, setMine] = useState<MyAvailability[]>([]);

  useEffect(() => {
    api.get('/players').then((r) => setPlayers(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    const load = () => {
      api.get('/channels').then((r) => setChannels(sortChannels(r.data))).catch(() => {});
      api.get('/availability/mine').then((r) => setMine(r.data)).catch(() => {});
    };
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [token]);

  const rank = useMemo(() => players.findIndex((p) => p._id === player?._id), [players, player]);
  const me = rank >= 0 ? players[rank] : null;

  const next = useMemo(() => {
    const upcoming = channels
      .filter((c) => c.nextMatch && Date.parse(matchEnd(c.nextMatch.start, c.nextMatch.duration)) > Date.now())
      .sort((a, b) => Date.parse(a.nextMatch!.start) - Date.parse(b.nextMatch!.start));
    return upcoming[0] ?? null;
  }, [channels]);

  const unreadTotal = channels.reduce((n, c) => n + c.unread, 0);
  const withPartners = mine.filter((a) => a.matches.length > 0);
  const waiting = mine.filter((a) => a.matches.length === 0);

  return (
    <div className="page home-page">
      <PendingClaims />

      {/* En-tête */}
      {token && player ? (
        <Link to="/ranking" className="home-hero">
          <div>
            <div className="home-hello">Salut {player.username} 👋</div>
            <div className="home-rank">
              {rank >= 0 ? <>#{rank + 1} au classement</> : 'Pas encore classé'}
              {me && me.currentStreak > 0 && <span className="streak-badge">🔥{me.currentStreak}</span>}
            </div>
          </div>
          <div className="home-elo">
            <span className="home-elo-value">{me?.elo ?? player.elo}</span>
            <span className="home-elo-label">ELO</span>
          </div>
        </Link>
      ) : (
        <div className="home-welcome">
          <div className="home-hello">Bienvenue sur PadlEcau 🎾</div>
          <p>Classement ELO, partenaires dispos, terrains libres et discussions pour organiser tes matchs.</p>
          <div className="home-welcome-actions">
            <Link to="/login" className="btn-primary booking-cta">Se connecter</Link>
            <Link to="/register" className="secondary-link">Créer un compte</Link>
          </div>
        </div>
      )}

      {/* Prochain match validé */}
      {next?.nextMatch && (
        <section className="home-section">
          <div className="next-match">
            <div className="next-match-label">Prochain match</div>
            <div className="next-match-when">
              {dayLabel(next.nextMatch.start)} · {hm(next.nextMatch.start)}–{hm(matchEnd(next.nextMatch.start, next.nextMatch.duration))}
            </div>
            <div className="next-match-sub">
              {next.nextMatch.courtNumber ? `Terrain ${next.nextMatch.courtNumber} · ${next.nextMatch.courtName}` : 'Terrain à choisir'}
              {' · avec '}
              {next.members.filter((m) => m._id !== player?._id).map((m) => m.username).join(', ')}
            </div>
            <div className="next-match-actions">
              {next.nextMatch.bookingUrl && (
                <a href={next.nextMatch.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary booking-cta">
                  Réserver sur Playtomic
                </a>
              )}
              <Link to={`/channels/${next._id}`} className="secondary-link">Discussion</Link>
            </div>
          </div>
        </section>
      )}

      {token && (
        <>
          {/* Messages */}
          <section className="home-section">
            <div className="section-head">
              <h2>Messages {unreadTotal > 0 && <span className="tab-badge">{unreadTotal}</span>}</h2>
              {channels.length > 0 && <Link to="/channels" className="see-all">Tout voir</Link>}
            </div>
            {channels.length === 0 ? (
              <div className="empty-card compact">
                <p>Aucune discussion pour l'instant. Elles s'ouvrent quand un joueur est dispo en même temps que toi.</p>
              </div>
            ) : (
              <div className="channel-list">
                {channels.slice(0, 3).map((c) => <ChannelCard key={c._id} c={c} meId={player?._id} />)}
              </div>
            )}
          </section>

          {/* Dispos */}
          <section className="home-section">
            <div className="section-head">
              <h2>Mes dispos</h2>
              <Link to="/partners" className="see-all">Gérer</Link>
            </div>
            {mine.length === 0 ? (
              <div className="empty-card compact">
                <p>Indique quand tu peux jouer pour trouver des partenaires.</p>
                <Link to="/partners?add=1" className="btn-primary booking-cta">Ajouter une dispo</Link>
              </div>
            ) : (
              <div className="dispo-mini-list">
                {[...withPartners, ...waiting].slice(0, 4).map((a) => (
                  <Link key={a._id} to={a.channelId ? `/channels/${a.channelId}` : '/partners'} className="dispo-mini">
                    <div>
                      <div className="dispo-mini-when">{dayLabel(a.start, 'short')} · {hm(a.start)}–{hm(a.end)}</div>
                      <div className="dispo-mini-who">
                        {a.matches.length > 0
                          ? `Avec ${a.matches.map((m) => m.player.username).join(', ')}`
                          : "En attente d'autres joueurs"}
                      </div>
                    </div>
                    <span className={`players-pill${a.matches.length ? ' ok' : ''}`}>
                      {Math.min(a.matches.length + 1, 4)}/4
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Classement */}
      <section className="home-section">
        <div className="section-head">
          <h2>Classement</h2>
          <Link to="/ranking" className="see-all">Complet</Link>
        </div>
        <div className="mini-ranking">
          {players.slice(0, 5).map((p, i) => (
            <Link key={p._id} to={`/players/${p._id}`} className={`mini-rank-row${p._id === player?._id ? ' me' : ''}`}>
              <span className={`rank-badge ${i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : ''}`}>#{i + 1}</span>
              <span className="mini-rank-name">{p.username}</span>
              <span className="mini-rank-elo">{p.elo}</span>
            </Link>
          ))}
          {players.length === 0 && <div className="empty-state">Aucun joueur pour l'instant.</div>}
        </div>
      </section>
    </div>
  );
}
