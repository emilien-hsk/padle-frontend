import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ClaimRequest {
  guest: { _id: string; username: string; elo: number };
  claimant: { username: string } | null;
}

export default function PendingClaims() {
  const { token } = useAuth();
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.get<ClaimRequest[]>('/players/pending-claims')
      .then((r) => setClaims(r.data))
      .finally(() => setLoading(false));
  }, [token]);

  async function approve(guestId: string) {
    setApproving(guestId);
    try {
      await api.post(`/players/${guestId}/claim/approve`);
      setClaims((prev) => prev.filter((c) => c.guest._id !== guestId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setApproving(null);
    }
  }

  if (!token || loading || claims.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(200,241,53,0.05)',
      border: '1px solid rgba(200,241,53,0.2)',
      borderRadius: 16,
      padding: '1rem 1.25rem',
      marginBottom: '1rem',
    }}>
      <h3 style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>
        Demandes de fusion en attente
      </h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        Ces joueurs affirment avoir joué en tant qu'invité. Confirmez si vous avez bien joué avec eux.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {claims.map(({ guest, claimant }) => (
          <div key={guest._id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '0.7rem 1rem',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {claimant?.username ?? '?'}{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>réclame le profil</span>{' '}
                <span style={{ color: 'var(--accent)' }}>"{guest.username}"</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {guest.elo} ELO à fusionner
              </div>
            </div>
            <button
              type="button"
              onClick={() => approve(guest._id)}
              disabled={approving === guest._id}
              style={{
                background: 'var(--accent)', color: '#0a0a0a',
                border: 'none', borderRadius: 8,
                padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 700,
                cursor: 'pointer', opacity: approving === guest._id ? 0.6 : 1,
              }}
            >
              {approving === guest._id ? '...' : 'Confirmer'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
