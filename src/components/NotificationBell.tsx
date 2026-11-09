import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';

const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

export default function NotificationBell() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (!token) return;
    api.get('/notifications').then((r) => {
      setItems(r.data.items);
      setUnread(r.data.unread);
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    load();
    const id = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [token, load]);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);

  if (!token) return null;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      api.post('/notifications/read-all').catch(() => {});
    } else if (!next) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div ref={ref} className="notif-wrap">
      <button className={`notif-btn${open ? ' open' : ''}`} onClick={toggle} aria-label="Notifications">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && <span className="notif-count">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel tuto-panel">
          <div className="notif-panel-title">Notifications</div>
          {items.length === 0 ? (
            <div className="notif-empty">
              Aucune notification. Ajoute tes dispos dans <strong>Jouer → Partenaires</strong> pour être prévenu quand quelqu'un est libre en même temps.
            </div>
          ) : (
            <div className="notif-list">
              {items.map((n) => (
                <button
                  key={n._id}
                  className={`notif-item${n.read ? '' : ' unread'}`}
                  onClick={() => { setOpen(false); navigate(n.url || '/partners'); }}
                >
                  <span className="notif-item-title">{n.title}</span>
                  <span className="notif-item-body">{n.body}</span>
                  <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
