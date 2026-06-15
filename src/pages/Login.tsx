import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Email ou mot de passe incorrect');
    }
  }

  return (
    <div className="auth-page">
      <h1>Connexion</h1>
      <p className="auth-subtitle">Retrouvez vos stats et votre classement</p>
      <form onSubmit={submit} className="auth-card">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary">Se connecter</button>
      </form>
      <p>Pas encore de compte ? <Link to="/register">S'inscrire</Link></p>
    </div>
  );
}
