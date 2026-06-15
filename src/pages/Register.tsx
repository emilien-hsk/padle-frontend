import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Player } from '../types';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Étape 1 : inscription
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'claim'>('form');

  // Étape 2 : claim profil invité
  const [search, setSearch] = useState('');
  const [guests, setGuests] = useState<Player[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimDone, setClaimDone] = useState(false);

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

  async function searchGuests() {
    if (!search.trim()) return;
    const { data } = await api.get<Player[]>('/players');
    setGuests(data.filter((p) => !p.isRegistered && p.username.toLowerCase().includes(search.toLowerCase())));
  }

  async function claimProfile(guestId: string) {
    setClaiming(guestId);
    try {
      await api.post(`/players/${guestId}/claim`);
      setClaimDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la demande');
    } finally {
      setClaiming(null);
    }
  }

  if (step === 'claim') {
    return (
      <div className="auth-page" style={{ maxWidth: 440 }}>
        <h1>Bienvenue !</h1>
        <p className="auth-subtitle">Avez-vous déjà joué en tant qu'invité ?</p>

        {claimDone ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✅</div>
            <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Demande envoyée !
            </p>
            <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
              Un joueur ayant partagé un match avec ce profil devra valider la fusion.
            </p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Accéder au classement
            </button>
          </div>
        ) : (
          <div className="auth-card">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '0.25rem' }}>
              Si vous avez joué avant de créer votre compte, retrouvez votre profil invité pour fusionner vos points ELO et statistiques.
            </p>

            <div className="guest-section">
              <input
                placeholder="Rechercher votre nom d'invité..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchGuests())}
              />
              <button type="button" onClick={searchGuests}>Chercher</button>
            </div>

            {error && <p className="error">{error}</p>}

            {guests.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {guests.map((g) => (
                  <div key={g._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '0.65rem 1rem',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.elo} ELO · Invité</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => claimProfile(g._id)}
                      disabled={claiming === g._id}
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(200,241,53,0.3)', borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      {claiming === g._id ? '...' : 'Réclamer'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {guests.length === 0 && search && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Aucun profil invité trouvé pour "{search}".</p>
            )}

            <button type="button" onClick={() => navigate('/')} style={{ width: '100%', textAlign: 'center', marginTop: '0.25rem' }}>
              Ignorer, continuer sans fusionner
            </button>
          </div>
        )}
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
