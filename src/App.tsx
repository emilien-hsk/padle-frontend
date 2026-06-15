import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
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

function Layout() {
  return (
    <>
      <header className="app-header">
        <img src="/logo.png" alt="PadleCourt" className="logo-img" />
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
