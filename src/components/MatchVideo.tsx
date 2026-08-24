import { useState, useEffect } from 'react';
import api from '../services/api';
import { Match } from '../types';
import { useAuth } from '../context/AuthContext';
import { parseYouTubeId, embedUrl, watchUrl } from '../utils/youtube';

/**
 * Lecteur plein écran. L'iframe n'est montée qu'à l'ouverture : présente en
 * permanence dans l'historique, elle chargerait le player YouTube pour chaque
 * match de la liste.
 */
function PlayerModal({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    // La page derrière la modale ne doit pas défiler pendant la lecture.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="video-overlay" onClick={onClose}>
      <div className="video-modal" onClick={(e) => e.stopPropagation()}>
        <div className="video-frame">
          <iframe
            src={embedUrl(videoId)}
            title="Vidéo du match"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="video-actions">
          <a href={watchUrl(videoId)} target="_blank" rel="noreferrer">Ouvrir sur YouTube</a>
          <button type="button" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/** Confirmation bloquante : le retrait est irréversible et la vidéo peut avoir
 *  été postée par quelqu'un d'autre. */
function ConfirmRemove({ busy, onCancel, onConfirm }: { busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="team-assign-overlay" onClick={onCancel}>
      <div className="team-assign-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-title">Retirer la vidéo&nbsp;?</div>
        <p className="confirm-text">
          Elle ne sera plus visible sur ce match. La vidéo reste sur YouTube&nbsp;: seul le lien
          est supprimé.
        </p>
        <div className="confirm-actions">
          <button type="button" onClick={onCancel} disabled={busy}>Annuler</button>
          <button type="button" className="confirm-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Retrait…' : 'Retirer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MatchVideo({ match, onChange }: { match: Match; onChange: (m: Match) => void }) {
  const { token, player } = useAuth();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Le back applique la même règle ; ce test ne sert qu'à ne pas proposer une
  // action qui serait refusée.
  const isParticipant =
    !!player &&
    [...match.teamA, ...match.teamB].some((p) => p._id === player._id);
  const canRemove = !!token && (isParticipant || player?.isAdmin === true);

  // Validation locale pendant la frappe : le bouton reste inerte tant que le
  // lien n'est pas exploitable, plutôt que d'attendre un aller-retour serveur.
  const parsed = parseYouTubeId(url);
  const dirty = url.trim().length > 0;

  async function save() {
    if (!parsed) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.put(`/matches/${match._id}/video`, { videoUrl: url });
      onChange(data);
      setUrl('');
      setAdding(false);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.delete(`/matches/${match._id}/video`);
      onChange(data);
      setOpen(false);
      setConfirming(false);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur');
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (match.video) {
    return (
      <>
        <button type="button" className="video-pill" onClick={() => setOpen(true)}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          Voir le match
        </button>
        {canRemove && (
          <button type="button" className="video-remove" onClick={() => setConfirming(true)} disabled={busy}>
            Retirer
          </button>
        )}
        {error && <span className="video-error">{error}</span>}
        {open && <PlayerModal videoId={match.video.videoId} onClose={() => setOpen(false)} />}
        {confirming && (
          <ConfirmRemove busy={busy} onCancel={() => setConfirming(false)} onConfirm={remove} />
        )}
      </>
    );
  }

  if (!token) return null;

  if (!adding) {
    return (
      <button type="button" className="video-add" onClick={() => setAdding(true)}>
        + Ajouter une vidéo
      </button>
    );
  }

  return (
    <div className="video-form">
      <input
        autoFocus
        placeholder="Coller le lien YouTube…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && parsed && save()}
      />
      <div className="video-form-actions">
        <button type="button" className="btn-primary" onClick={save} disabled={!parsed || busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={() => { setAdding(false); setUrl(''); setError(''); }}>
          Annuler
        </button>
      </div>
      {dirty && !parsed && <span className="video-error">Ce lien n'est pas une vidéo YouTube.</span>}
      {error && <span className="video-error">{error}</span>}
    </div>
  );
}
