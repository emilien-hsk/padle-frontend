import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import MyProfile from './pages/MyProfile';
import NewMatch from './pages/NewMatch';
import ScoreEntry from './pages/ScoreEntry';
import Admin from './pages/Admin';
import MatchHistory from './pages/MatchHistory';
import Tournaments from './pages/Tournaments';
import TournamentCreate from './pages/TournamentCreate';
import TournamentDetail from './pages/TournamentDetail';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function BottomNav() {
  const location = useLocation();
  const hideOn = ['/login', '/register'];
  if (hideOn.includes(location.pathname)) return null;

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Accueil</span>
      </NavLink>

      <NavLink to="/matches" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>Matchs</span>
      </NavLink>

      <NavLink to="/tournaments" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
        </svg>
        <span>Tournois</span>
      </NavLink>

      <NavLink to="/new-match" className={({ isActive }) => isActive ? 'nav-item nav-add active' : 'nav-item nav-add'}>
        <div className="add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
      </NavLink>

      <NavLink to="/my-profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Profil</span>
      </NavLink>
    </nav>
  );
}

function InstallTuto() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [open]);

  const iosSteps = ['Ouvrez le site dans Safari', 'Appuyez sur le bouton Partager (carré avec flèche vers le haut)', 'Appuyez sur "Sur l\'écran d\'accueil"', 'Confirmez en appuyant sur "Ajouter"'];
  const androidSteps = ['Ouvrez le site dans Chrome', 'Appuyez sur le menu (3 points en haut à droite)', 'Appuyez sur "Installer l\'application"', 'Confirmez en appuyant sur "Installer"'];

  return (
    <div ref={containerRef} style={{ marginLeft: 'auto', position: 'relative', flexShrink: 0 }}>
      <style>{`
        @keyframes popFromDot {
          from { opacity: 0; transform: scale(0.4) translateY(-8px); transform-origin: top right; }
          to   { opacity: 1; transform: scale(1) translateY(0);      transform-origin: top right; }
        }
        .tuto-panel { animation: popFromDot 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 26, height: 26, borderRadius: '50%',
          background: open ? 'rgba(200,241,53,0.15)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${open ? 'rgba(200,241,53,0.4)' : 'rgba(255,255,255,0.15)'}`,
          color: open ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          transition: 'all 0.15s',
        }}
      >i</button>

      {open && (
        <div className="tuto-panel" style={{
            position: 'absolute', top: 34, right: 0, zIndex: 300,
            background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16, padding: '1.25rem', width: 300,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text)' }}>
              Installer l'application
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                iPhone / iPad — Safari
              </div>
              {iosSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid rgba(200,241,53,0.3)', color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>{step}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Android — Chrome
              </div>
              {androidSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
      )}
    </div>
  );
}


function Layout() {
  return (
    <>
      <header className="app-header">
        <img src="/logo.png" alt="PadleCourt" className="logo-img" />
        <InstallTuto />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/matches" element={<MatchHistory />} />
          <Route path="/players/:id" element={<Profile />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/new-match" element={<ProtectedRoute><NewMatch /></ProtectedRoute>} />
          <Route path="/match/score" element={<ProtectedRoute><ScoreEntry /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/new" element={<ProtectedRoute><TournamentCreate /></ProtectedRoute>} />
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}
