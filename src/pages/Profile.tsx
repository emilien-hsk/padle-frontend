import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Player, PlayerStats, BADGE_LABELS } from '../types';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ player: Player; stats: PlayerStats } | null>(null);

  useEffect(() => {
    api.get(`/players/${id}`).then((r) => setData(r.data));
  }, [id]);

  if (!data) return <div className="page">Chargement...</div>;

  const { player, stats } = data;

  return (
    <div className="page">
      <div className="profile-header">
        <div className="avatar">{player.username[0].toUpperCase()}</div>
        <div>
          <h1>{player.username}</h1>
          {!player.isRegistered && <span className="badge-guest">Invité</span>}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{player.elo}</span>
          <span className="stat-label">ELO</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.winRate}%</span>
          <span className="stat-label">Victoires</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Matchs</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.wins}V {stats.losses}D {stats.draws}N</span>
          <span className="stat-label">Bilan</span>
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

      {player.badges.length > 0 && (
        <div className="badges-section">
          <h3>Badges</h3>
          <div className="badges-list">
            {player.badges.map((b) => (
              <div key={b} className="badge-item">
                <span className="badge-emoji">{BADGE_LABELS[b]?.emoji}</span>
                <div>
                  <div className="badge-name">{BADGE_LABELS[b]?.name}</div>
                  <div className="badge-desc">{BADGE_LABELS[b]?.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
