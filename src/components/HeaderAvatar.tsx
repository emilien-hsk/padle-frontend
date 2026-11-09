import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Accès au profil depuis l'en-tête (remplace l'onglet Profil). */
export default function HeaderAvatar() {
  const { player, token } = useAuth();
  const { pathname } = useLocation();

  if (!token) {
    if (pathname === '/login' || pathname === '/register') return null;
    return <Link to="/login" className="header-login">Connexion</Link>;
  }
  return (
    <Link
      to="/my-profile"
      className={`header-avatar${pathname === '/my-profile' ? ' active' : ''}`}
      aria-label="Mon profil"
    >
      {player?.username?.[0]?.toUpperCase() ?? '·'}
    </Link>
  );
}
