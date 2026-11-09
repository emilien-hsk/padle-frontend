import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Pop-up « Installe l'app » : uniquement sur téléphone, dans le navigateur
 * (jamais quand l'app est déjà ouverte depuis l'écran d'accueil).
 * « Plus tard » le masque pendant 7 jours.
 */
const STORAGE_KEY = 'installPromptDismissedAt';
const SNOOZE_MS = 7 * 24 * 3600 * 1000;
const SHOW_DELAY_MS = 3000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function platform(): 'ios' | 'android' | 'other' {
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/i.test(ua) || iPadOS) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(STORAGE_KEY));
    return !!at && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const os = platform();

  // Android / Chrome : on garde l'invite d'installation native pour notre bouton
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setOpen(false);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (os === 'other' || isStandalone() || recentlyDismissed()) return;
    const t = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [os]);

  if (!open || pathname === '/login' || pathname === '/register') return null;

  function later() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* navigation privée */ }
    setOpen(false);
  }

  async function installNow() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === 'accepted') setOpen(false);
  }

  const steps = os === 'ios'
    ? [
        <>Touche le bouton <strong>Partager</strong> <ShareIcon /> (en bas dans Safari, en haut dans Chrome)</>,
        <>Choisis <strong>« Sur l'écran d'accueil »</strong></>,
        <>Touche <strong>« Ajouter »</strong></>,
      ]
    : [
        <>Touche le menu <strong>⋮</strong> en haut à droite</>,
        <>Choisis <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong></>,
        <>Confirme</>,
      ];

  return (
    <div className="sheet-overlay" onClick={later}>
      <div className="action-sheet install-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="install-head">
          <div className="install-bell">🔔</div>
          <div>
            <div className="install-title">Active les notifications</div>
            <div className="install-sub">Ajoute PadlEcau à ton écran d'accueil</div>
          </div>
        </div>

        <p className="install-why">
          {os === 'ios'
            ? <>Sur iPhone, les notifications ne fonctionnent <strong>que si l'app est installée</strong> sur ton écran d'accueil.</>
            : <>Pour recevoir les notifications comme une vraie app, installe PadlEcau sur ton écran d'accueil.</>}
          {' '}Tu seras prévenu quand un joueur est dispo en même temps que toi, quand on te propose un horaire et quand un message arrive.
        </p>

        {deferred ? (
          <button type="button" className="btn-primary install-btn" onClick={installNow}>
            Installer l'app
          </button>
        ) : (
          <>
            <div className="install-how">Comment faire</div>
            <ol className="install-steps">
              {steps.map((s, i) => (
                <li key={i}><span className="install-step-num">{i + 1}</span><span>{s}</span></li>
              ))}
            </ol>
          </>
        )}

        <p className="install-after">
          Ouvre ensuite l'app depuis la nouvelle icône, puis touche <strong>« Activer les notifications »</strong> dans <strong>Jouer → Dispos</strong>.
        </p>

        <button type="button" className="sheet-cancel" onClick={later}>Plus tard</button>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg className="inline-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Partager">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
