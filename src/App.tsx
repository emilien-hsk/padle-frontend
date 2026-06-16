import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import MyProfile from './pages/MyProfile';
import NewMatch from './pages/NewMatch';
import ScoreEntry from './pages/ScoreEntry';
import Admin from './pages/Admin';
import MatchHistory from './pages/MatchHistory';
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
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          marginLeft: 'auto', width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Georgia, serif', fontStyle: 'italic', flexShrink: 0,
        }}
      >i</button>

      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', backdropFilter: 'blur(6px)',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '1.75rem', width: '100%', maxWidth: 340,
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', textAlign: 'center' }}>
              📲 Installer l'app
            </h2>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                🍎 iPhone / iPad (Safari)
              </div>
              {['Ouvrez le site dans Safari', 'Appuyez sur le bouton Partager (carré ↑)', 'Appuyez sur "Sur l\'écran d\'accueil"', 'Confirmez en appuyant sur "Ajouter"'].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid rgba(200,241,53,0.3)', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>{step}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                🤖 Android (Chrome)
              </div>
              {['Ouvrez le site dans Chrome', 'Appuyez sur ⋮ (menu en haut à droite)', 'Appuyez sur "Installer l\'application"', 'Confirmez en appuyant sur "Installer"'].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>{step}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setOpen(false)} style={{
              width: '100%', padding: '0.75rem', background: 'var(--accent)',
              color: '#0a0a0a', border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
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
