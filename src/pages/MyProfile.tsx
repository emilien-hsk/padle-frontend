import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PlayerStats, PlayerMatch, BADGE_LABELS } from '../types';
import PlayerHistory from '../components/PlayerHistory';

const AVATAR_COLORS = ['av-0', 'av-1', 'av-2', 'av-3', 'av-4', 'av-5'];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function MyProfile() {
  const { player, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [history, setHistory] = useState<PlayerMatch[]>([]);

  useEffect(() => {
    if (player) {
      api.get(`/players/${player._id}`).then((r) => {
        setStats(r.data.stats);
        setHistory(r.data.history ?? []);
      });
    }
  }, [player]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  if (loading) {
    return <div className="page" style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '4rem' }}>Chargement...</div>;
  }

  if (!player) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', paddingTop: '4rem' }}>
        <div style={{ fontSize: '3rem' }}>🎾</div>
        <h1 style={{ textAlign: 'center' }}>Mon Profil</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
          Connectez-vous pour accéder à votre profil, vos statistiques et votre classement.
        </p>
        <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '0.5rem' }}>
          Se connecter
        </Link>
        <Link to="/register" style={{ color: 'var(--accent)', fontSize: '0.88rem', textDecoration: 'none' }}>
          Créer un compte
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="profile-hero">
        <div className={`avatar-lg ${avatarColor(player.username)}`}>
          {player.username[0].toUpperCase()}
        </div>
        <div>
          <div className="profile-name">{player.username}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{player.email}</div>
        </div>
        <div className="elo-display">
          <div className="elo-value">{player.elo}</div>
          <div className="elo-label">ELO</div>
        </div>
      </div>

      {stats && (
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
      )}

      {stats?.bestPartner && (
        <div className="info-card synergy">
          <h3>Meilleur partenaire</h3>
          <p><strong>{stats.bestPartner.name}</strong> — {stats.bestPartner.winRate}% de victoires ensemble</p>
        </div>
      )}

      {stats?.nemesis && (
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
            const obtained = (player.badges ?? []).includes(key);
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

      {player.isAdmin && (
        <Link to="/admin" style={{
          display: 'block', textAlign: 'center', marginTop: '1rem',
          padding: '0.75rem', background: 'rgba(96,165,250,0.08)',
          border: '1px solid rgba(96,165,250,0.25)', borderRadius: 12,
          color: '#60a5fa', fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem',
        }}>
          ⚙️ Panneau admin
        </Link>
      )}

      <button
        onClick={handleLogout}
        style={{
          marginTop: '1.5rem', width: '100%', padding: '0.85rem',
          background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)',
          borderRadius: 12, color: 'var(--danger)', fontWeight: 700,
          fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        Déconnexion
      </button>
    </div>
  );
}
