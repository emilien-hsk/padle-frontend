import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PLAY_PATHS = ['/partners', '/booking'];
const COMPET_PATHS = ['/ranking', '/matches', '/tournaments'];

function ActionSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const go = (to: string) => { onClose(); navigate(to); };

  const actions = [
    { icon: '🎾', title: 'Enregistrer un score', sub: 'Un match que tu viens de jouer', to: '/new-match' },
    { icon: '🕒', title: 'Ajouter une dispo', sub: 'Trouver des partenaires pour jouer', to: '/partners?add=1' },
  ];

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="action-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {actions.map((a) => (
          <button key={a.to} type="button" className="sheet-action" onClick={() => go(a.to)}>
            <span className="sheet-icon">{a.icon}</span>
            <span className="sheet-text">
              <span className="sheet-title">{a.title}</span>
              <span className="sheet-sub">{a.sub}</span>
            </span>
          </button>
        ))}
        <button type="button" className="sheet-cancel" onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

export default function BottomNav() {
  const location = useLocation();
  const { token } = useAuth();
  const [sheet, setSheet] = useState(false);
  const [unread, setUnread] = useState(0);
  const path = location.pathname;

  useEffect(() => {
    if (!token) { setUnread(0); return; }
    const load = () => api.get('/channels/unread').then((r) => setUnread(r.data.unread)).catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [token, path]);

  useEffect(() => setSheet(false), [path]);

  if (['/login', '/register'].includes(path)) return null;

  const cls = (active: boolean) => `nav-item${active ? ' active' : ''}`;
  const inPlay = PLAY_PATHS.some((p) => path.startsWith(p));
  const inCompet = COMPET_PATHS.some((p) => path.startsWith(p));
  const inMessages = path.startsWith('/channels');

  return (
    <>
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => cls(isActive)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Accueil</span>
        </NavLink>

        <NavLink to="/partners" className={() => cls(inPlay)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Raquette de padel */}
            <g transform="rotate(30 12 12)">
              <path d="M12 1.5c3.6 0 6 2.9 6 6.6 0 3-1.7 5.4-4.2 6.4L13.3 17h-2.6l-.5-2.5C7.7 13.5 6 11.1 6 8.1 6 4.4 8.4 1.5 12 1.5z" />
              <rect x="10.4" y="17" width="3.2" height="5.5" rx="1.2" />
              <g fill="currentColor" stroke="none">
                <circle cx="10" cy="6" r="0.85" />
                <circle cx="14" cy="6" r="0.85" />
                <circle cx="12" cy="8.3" r="0.85" />
                <circle cx="10" cy="10.6" r="0.85" />
                <circle cx="14" cy="10.6" r="0.85" />
              </g>
            </g>
          </svg>
          <span>Jouer</span>
        </NavLink>

        <button type="button" className="nav-item nav-add" onClick={() => setSheet(true)} aria-label="Créer">
          <div className={`add-btn${sheet ? ' open' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        </button>

        <NavLink to="/channels" className={() => cls(inMessages)}>
          <span className="nav-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>}
          </span>
          <span>Messages</span>
        </NavLink>

        <NavLink to="/ranking" className={() => cls(inCompet)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
          </svg>
          <span>Compet</span>
        </NavLink>
      </nav>
      {sheet && <ActionSheet onClose={() => setSheet(false)} />}
    </>
  );
}
