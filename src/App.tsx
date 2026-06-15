import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import NewMatch from './pages/NewMatch';
import MatchHistory from './pages/MatchHistory';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function Layout() {
  const { player, logout } = useAuth();

  return (
    <>
      <header className="app-header">
        <span className="logo">🎾 Padle</span>
        <nav>
          <NavLink to="/">Classement</NavLink>
          <NavLink to="/matches">Matchs</NavLink>
          {player ? (
            <>
              <NavLink to={`/players/${player._id}`}>Mon profil</NavLink>
              <NavLink to="/new-match">+ Match</NavLink>
              <button onClick={logout} className="btn-logout">Déconnexion</button>
            </>
          ) : (
            <NavLink to="/login">Connexion</NavLink>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/matches" element={<MatchHistory />} />
          <Route path="/players/:id" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/new-match" element={<ProtectedRoute><NewMatch /></ProtectedRoute>} />
        </Routes>
      </main>
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
