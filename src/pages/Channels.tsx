import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChannelSummary } from '../types';
import ChannelCard, { sortChannels } from '../components/ChannelCard';

export default function Channels() {
  const { token, player } = useAuth();
  const [channels, setChannels] = useState<ChannelSummary[] | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = () => api.get('/channels').then((r) => setChannels(sortChannels(r.data))).catch(() => setChannels([]));
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [token]);

  return (
    <div className="page">
      <h1>Messages</h1>

      {!token ? (
        <div className="push-card">
          <div className="push-card-title">Connecte-toi pour voir tes messages</div>
          <Link to="/login" className="btn-primary booking-cta">Se connecter</Link>
        </div>
      ) : channels === null ? (
        <div className="empty-state">Chargement…</div>
      ) : channels.length === 0 ? (
        <div className="empty-card">
          <div className="empty-card-title">Pas encore de discussion</div>
          <p>Une discussion s'ouvre automatiquement avec les joueurs dispos en même temps que toi.</p>
          <Link to="/partners?add=1" className="btn-primary booking-cta">Ajouter une dispo</Link>
        </div>
      ) : (
        <>
          <div className="channel-list">
            {channels.map((c) => <ChannelCard key={c._id} c={c} meId={player?._id} />)}
          </div>
          <p className="list-footnote">Les discussions disparaissent 24 h après la fin du créneau.</p>
        </>
      )}
    </div>
  );
}
