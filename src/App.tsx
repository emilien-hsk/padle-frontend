import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Booking from './pages/Booking';
import Partners from './pages/Partners';
import Channels from './pages/Channels';
import ChannelChat from './pages/ChannelChat';
import NotificationBell from './components/NotificationBell';
import BottomNav from './components/BottomNav';
import HeaderAvatar from './components/HeaderAvatar';
import InstallPrompt from './components/InstallPrompt';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { token, player, loading } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (loading) return null;
  return player?.isAdmin ? children : <Navigate to="/tournaments" replace />;
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
    <div ref={containerRef} style={{ position: 'relative', flexShrink: 0 }}>
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
        <div className="header-actions">
          <InstallTuto />
          <NotificationBell />
          <HeaderAvatar />
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ranking" element={<Leaderboard />} />
          <Route path="/matches" element={<MatchHistory />} />
          <Route path="/players/:id" element={<Profile />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/new-match" element={<ProtectedRoute><NewMatch /></ProtectedRoute>} />
          <Route path="/match/score" element={<ProtectedRoute><ScoreEntry /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/new" element={<AdminRoute><TournamentCreate /></AdminRoute>} />
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/channels/:id" element={<ChannelChat />} />
        </Routes>
      </main>
      <BottomNav />
      <InstallPrompt />
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
