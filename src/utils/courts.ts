import api from '../services/api';
import { CourtAvailability, DayAvailability } from '../types';

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const hm = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// Une seule requête par jour, partagée entre les cartes
const dayCache = new Map<string, Promise<DayAvailability>>();
export function loadDay(date: string): Promise<DayAvailability> {
  if (!dayCache.has(date)) {
    const p = api.get(`/booking/availability`, { params: { date } }).then((r) => r.data as DayAvailability);
    p.catch(() => dayCache.delete(date));
    dayCache.set(date, p);
    setTimeout(() => dayCache.delete(date), 60_000);
  }
  return dayCache.get(date)!;
}

export interface FreeAtTime {
  time: string;
  courts: { court: CourtAvailability; url: string; price: string }[];
}

export function findFreeCourts(day: DayAvailability, start: Date, end: Date) {
  const windowMin = (end.getTime() - start.getTime()) / 60000;
  const durations = windowMin >= 90 ? [90, 60] : [60];
  for (const duration of durations) {
    const byTime = new Map<string, FreeAtTime>();
    for (const court of day.courts) {
      for (const slot of court.slots) {
        if (slot.duration !== duration) continue;
        const s = Date.parse(slot.start);
        if (s < start.getTime() || s + duration * 60000 > end.getTime()) continue;
        const entry = byTime.get(slot.time) ?? { time: slot.time, courts: [] };
        const price = slot.price !== null ? `${slot.price.toLocaleString('fr-FR')} €` : slot.priceLabel;
        entry.courts.push({ court, url: slot.bookingUrl, price });
        byTime.set(slot.time, entry);
      }
    }
    if (byTime.size > 0) {
      return { duration, times: [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time)) };
    }
  }
  return null;
}

