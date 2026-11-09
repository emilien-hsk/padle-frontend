import { NavLink } from 'react-router-dom';

/** Sous-onglets de la section « Compet ». */
export default function CompetTabs() {
  const tab = ({ isActive }: { isActive: boolean }) => `play-tab${isActive ? ' active' : ''}`;
  return (
    <div className="play-tabs">
      <NavLink to="/ranking" className={tab}>Classement</NavLink>
      <NavLink to="/matches" className={tab}>Matchs</NavLink>
      <NavLink to="/tournaments" className={tab}>Tournois</NavLink>
    </div>
  );
}
