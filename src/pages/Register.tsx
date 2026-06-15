import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Player } from '../types';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'claim'>('form');

  const [guests, setGuests] = useState<Player[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedId, setClaimedId] = useState<string | null>(null);

  useEffect(() => {
    if (step === 'claim') {
      api.get<Player[]>('/players').then((r) =>
        setGuests(r.data.filter((p) => !p.isRegistered))
      );
    }
  }, [step]);

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await register(username, email, password);
      setStep('claim');
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    }
  }

  async function claimProfile(guestId: string) {
    setClaiming(guestId);
    setError('');
    try {
      await api.post(`/players/${guestId}/claim`);
      setClaimedId(guestId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la demande');
    } finally {
      setClaiming(null);
    }
  }

  if (step === 'claim') {
    return (
      <div className="auth-page" style={{ maxWidth: 460 }}>
        <h1>Bienvenue !</h1>
        <p className="auth-subtitle">
          Avez-vous déjà joué en tant qu'invité ? Sélectionnez votre profil pour fusionner vos points ELO.
        </p>

        <div className="auth-card" style={{ gap: '0.5rem' }}>
          {guests.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem 0' }}>
              Aucun profil invité existant.
            </p>
          )}

          {guests.map((g) => {
            const isClaimed = claimedId === g._id;
            return (
              <div key={g._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: isClaimed ? 'rgba(200,241,53,0.06)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isClaimed ? 'rgba(200,241,53,0.3)' : 'var(--border)'}`,
                borderRadius: 10, padding: '0.7rem 1rem',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.elo} ELO · Invité</div>
                </div>

                {isClaimed ? (
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>
                    ✓ Demande envoyée
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => claimProfile(g._id)}
                    disabled={claiming === g._id || claimedId !== null}
                    style={{
                      background: 'var(--accent-dim)', color: 'var(--accent)',
                      border: '1px solid rgba(200,241,53,0.3)', borderRadius: 8,
                      padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 600,
                      opacity: claimedId !== null ? 0.4 : 1,
                    }}
                  >
                    {claiming === g._id ? '...' : 'C\'est moi'}
                  </button>
                )}
              </div>
            );
          })}

          {error && <p className="error">{error}</p>}

          {claimedId && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
              Un joueur ayant partagé un match avec ce profil pourra valider la fusion depuis son profil.
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '0.75rem' }}>
          {claimedId ? 'Accéder au classement' : 'Ignorer, continuer sans fusionner'}
        </button>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h1>Inscription</h1>
      <p className="auth-subtitle">Rejoignez le classement de votre groupe</p>
      <form onSubmit={submitRegister} className="auth-card">
        <input placeholder="Pseudo" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe (6 caractères min.)" value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary">Créer mon compte</button>
      </form>
      <p>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
    </div>
  );
}
