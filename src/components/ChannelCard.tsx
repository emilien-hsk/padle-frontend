import { Link } from 'react-router-dom';
import { ChannelSummary } from '../types';
import { hm } from '../utils/courts';

export const dayLabel = (iso: string, style: 'long' | 'short' = 'long') => {
  const s = new Date(iso).toLocaleDateString('fr-FR', { weekday: style, day: 'numeric', month: style === 'long' ? 'long' : 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function matchEnd(start: string, duration: number): string {
  return new Date(new Date(start).getTime() + duration * 60000).toISOString();
}

/** Trie : match validé à venir d'abord, puis non lus, puis activité récente. */
export function sortChannels(list: ChannelSummary[]): ChannelSummary[] {
  return [...list].sort((a, b) => {
    if (!!a.nextMatch !== !!b.nextMatch) return a.nextMatch ? -1 : 1;
    if (a.nextMatch && b.nextMatch) return Date.parse(a.nextMatch.start) - Date.parse(b.nextMatch.start);
    if (!!a.unread !== !!b.unread) return a.unread ? -1 : 1;
    const la = a.lastMessage ? Date.parse(a.lastMessage.createdAt) : 0;
    const lb = b.lastMessage ? Date.parse(b.lastMessage.createdAt) : 0;
    return lb - la;
  });
}

export default function ChannelCard({ c, meId }: { c: ChannelSummary; meId?: string }) {
  const others = c.members.filter((m) => m._id !== meId);
  return (
    <Link to={`/channels/${c._id}`} className={`channel-card${c.unread ? ' unread' : ''}`}>
      {c.nextMatch && (
        <div className="channel-match-banner">
          ✅ Match {dayLabel(c.nextMatch.start, 'short').toLowerCase()} · {hm(c.nextMatch.start)}
          {c.nextMatch.courtNumber ? ` · T${c.nextMatch.courtNumber}` : ''}
        </div>
      )}
      <div className="channel-card-top">
        <div className="channel-avatars">
          {others.slice(0, 3).map((m) => (
            <span key={m._id} className="mini-avatar">{m.username[0]?.toUpperCase()}</span>
          ))}
        </div>
        <div className="channel-card-main">
          <div className="channel-names">{others.map((m) => m.username).join(', ')}</div>
          <div className="channel-when">{dayLabel(c.start, 'short')} · {hm(c.start)}–{hm(c.end)}</div>
        </div>
        {c.unread > 0 && <span className="tab-badge big">{c.unread}</span>}
      </div>
      {c.lastMessage && (
        <div className="channel-last">
          {c.lastMessage.author ? <strong>{c.lastMessage.author.username} : </strong> : null}
          {c.lastMessage.text}
        </div>
      )}
    </Link>
  );
}
