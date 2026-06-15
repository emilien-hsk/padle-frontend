import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Player, PlayerStats, PlayerMatch, BADGE_LABELS } from '../types';
import PlayerHistory from '../components/PlayerHistory';

const AVATAR_COLORS = ['av-0', 'av-1', 'av-2', 'av-3', 'av-4', 'av-5'];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash += c.charCodeAt(0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ player: Player; stats: PlayerStats; history: PlayerMatch[] } | null>(null);

  useEffect(() => {
    api.get(`/players/${id}`).then((r) => setData(r.data));
  }, [id]);

  if (!data) return <div className="page" style={{ color: 'var(--text-muted)' }}>Chargement...</div>;

  const { player, stats, history } = data;

  return (
    <div className="page">
      <div className="profile-hero">
        <div className={`avatar-lg ${avatarColor(player.username)}`}>
          {player.username[0].toUpperCase()}
        </div>
        <div>
          <div className="profile-name">{player.username}</div>
          {!player.isRegistered && <div className="badge-guest">Invité</div>}
        </div>
        <div className="elo-display">
          <div className="elo-value">{player.elo}</div>
          <div className="elo-label">ELO</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{stats.wins}</div>
          <div className="stat-label">Victoires</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Matchs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.winRate}%</div>
          <div className="stat-label">Win rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {player.currentStreak > 0 ? <>🔥{player.currentStreak}</> : '—'}
          </div>
          <div className="stat-label">Série actuelle</div>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-value">🏆 {player.bestStreak || 0}</div>
          <div className="stat-label">Meilleure série</div>
        </div>
      </div>

      {stats.bestPartner && (
        <div className="info-card synergy">
          <h3>Meilleur partenaire</h3>
          <p><strong>{stats.bestPartner.name}</strong> — {stats.bestPartner.winRate}% de victoires ensemble</p>
        </div>
      )}

      {stats.nemesis && (
        <div className="info-card nemesis">
          <h3>Bête noire</h3>
          <p><strong>{stats.nemesis.name}</strong> — {stats.nemesis.lossRate}% de défaites contre lui</p>
        </div>
      )}

      <PlayerHistory history={history} playerId={player._id} />

      <div className="badges-section">
        <h3>Badges</h3>
        <div className="badges-list">
          {Object.entries(BADGE_LABELS).map(([key, badge]) => {
            const obtained = player.badges.includes(key);
            return (
              <div key={key} className={`badge-item ${obtained ? '' : 'badge-locked'}`}>
                <span className="badge-emoji">{badge.emoji}</span>
                <div>
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-desc">{badge.desc}</div>
                </div>
                {obtained && <span className="badge-check">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
