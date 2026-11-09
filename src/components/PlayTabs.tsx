import { NavLink } from 'react-router-dom';

/** Sous-onglets de la section « Jouer » : dispos & partenaires / terrains libres. */
export default function PlayTabs() {
  const tab = ({ isActive }: { isActive: boolean }) => `play-tab${isActive ? ' active' : ''}`;
  return (
    <div className="play-tabs">
      <NavLink to="/partners" className={tab}>Dispos</NavLink>
      <NavLink to="/booking" className={tab}>Terrains</NavLink>
    </div>
  );
}
