import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlayTabs from '../components/PlayTabs';
import api from '../services/api';
import { BookingClub, CourtAvailability, CourtSlot, CourtType, DayAvailability } from '../types';

const DURATIONS = [60, 90, 120];
const DAYS_SHOWN = 14;

const TYPE_LABEL: Record<CourtType, string> = {
  indoor: 'Intérieur',
  covered: 'Semi-couvert',
  outdoor: 'Extérieur',
};

type TypeFilter = 'all' | CourtType;

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nextDays(count: number): Date[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

function dayLabel(d: Date, index: number): { top: string; bottom: string } {
  if (index === 0) return { top: 'Auj.', bottom: String(d.getDate()) };
  if (index === 1) return { top: 'Dem.', bottom: String(d.getDate()) };
  return {
    top: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
    bottom: String(d.getDate()),
  };
}

function endTime(time: string, duration: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + duration;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function formatPrice(slot: CourtSlot): string {
  if (slot.price === null) return slot.priceLabel;
  return `${slot.price.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}

interface Selection {
  court: CourtAvailability;
  slot: CourtSlot;
}

export default function Booking() {
  const days = useMemo(() => nextDays(DAYS_SHOWN), []);
  const [club, setClub] = useState<BookingClub | null>(null);
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(() => {
    const wanted = searchParams.get('date');
    return wanted && days.some((d) => toIsoDate(d) === wanted) ? wanted : toIsoDate(days[0]);
  });
  const [duration, setDuration] = useState(90);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [data, setData] = useState<DayAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);

  useEffect(() => {
    api.get('/booking/club').then((r) => setClub(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelected(null);
    api
      .get(`/booking/availability`, { params: { date } })
      .then((r) => { if (!cancelled) setData(r.data); })
      .catch((e) => {
        if (cancelled) return;
        setData(null);
        setError(e.response?.data?.message || 'Impossible de charger les disponibilités.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date]);

  useEffect(() => setSelected(null), [duration, typeFilter]);

  const courts = useMemo(
    () => (data?.courts ?? []).filter((c) => typeFilter === 'all' || c.type === typeFilter),
    [data, typeFilter]
  );

  // Colonnes de la grille : toutes les heures de début possibles pour la durée choisie
  const times = useMemo(() => {
    const set = new Set<string>();
    courts.forEach((c) => c.slots.forEach((s) => { if (s.duration === duration) set.add(s.time); }));
    return [...set].sort();
  }, [courts, duration]);

  const freeCount = useMemo(
    () => courts.reduce((n, c) => n + c.slots.filter((s) => s.duration === duration).length, 0),
    [courts, duration]
  );

  const clubUrl = data?.clubUrl || club?.url || 'https://playtomic.com/clubs/smashing-club-le-roeulx';
  const selectedDate = days.find((d) => toIsoDate(d) === date);

  return (
    <div className={`page booking-page${selected ? ' has-sheet' : ''}`}>
      <PlayTabs />
      <div className="booking-head">
        <div>
          <h1>Réserver</h1>
          <div className="booking-club">
            <span className="booking-club-name">{club?.name ?? 'Smashing Club Le Roeulx'}</span>
            {club?.address && <span className="booking-club-addr">{club.address}</span>}
          </div>
        </div>
        <a className="booking-ext-link" href={clubUrl} target="_blank" rel="noopener noreferrer">
          Playtomic ↗
        </a>
      </div>

      {/* Jours */}
      <div className="day-strip">
        {days.map((d, i) => {
          const iso = toIsoDate(d);
          const { top, bottom } = dayLabel(d, i);
          return (
            <button
              key={iso}
              type="button"
              className={`day-chip${iso === date ? ' active' : ''}`}
              onClick={() => setDate(iso)}
            >
              <span className="day-chip-top">{top}</span>
              <span className="day-chip-num">{bottom}</span>
            </button>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="booking-filters">
        <div className="segmented">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={d === duration ? 'active' : ''}
              onClick={() => setDuration(d)}
            >
              {d} min
            </button>
          ))}
        </div>
        <div className="type-filters">
          {(['all', 'indoor', 'covered', 'outdoor'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`type-chip${t === typeFilter ? ' active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'all' ? 'Tous' : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="empty-state">Chargement des disponibilités…</div>
      ) : error ? (
        <div className="booking-error">
          <p>{error}</p>
          <a className="btn-primary booking-cta" href={clubUrl} target="_blank" rel="noopener noreferrer">
            Voir les disponibilités sur Playtomic
          </a>
        </div>
      ) : times.length === 0 ? (
        <div className="empty-state">
          Aucun créneau de {duration} min disponible
          {selectedDate ? ` le ${selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''}.
        </div>
      ) : (
        <>
          <div className="booking-summary">
            {freeCount} créneau{freeCount > 1 ? 'x' : ''} libre{freeCount > 1 ? 's' : ''} · touche une case pour réserver
          </div>
          <div className="avail-grid-wrap">
            <table className="avail-grid">
              <thead>
                <tr>
                  <th className="court-col">Terrain</th>
                  {times.map((t) => (
                    <th key={t} className={t.endsWith(':00') ? 'hour' : 'half'}>
                      {t.endsWith(':00') ? `${parseInt(t, 10)}h` : ':30'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courts.map((c) => {
                  const byTime = new Map(
                    c.slots.filter((s) => s.duration === duration).map((s) => [s.time, s])
                  );
                  return (
                    <tr key={c.id}>
                      <th className="court-col">
                        <span className={`court-num ${c.type}`}>{c.number}</span>
                        <span className="court-name">{c.name}</span>
                      </th>
                      {times.map((t) => {
                        const slot = byTime.get(t);
                        const isSel = selected?.court.id === c.id && selected.slot.time === t;
                        return (
                          <td key={t}>
                            {slot ? (
                              <button
                                type="button"
                                className={`slot-cell free${isSel ? ' selected' : ''}`}
                                onClick={() => setSelected(isSel ? null : { court: c, slot })}
                                aria-label={`Terrain ${c.number} à ${t}`}
                              />
                            ) : (
                              <span className="slot-cell busy" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid-legend">
            <span><i className="lg free" /> Libre</span>
            <span><i className="lg busy" /> Indisponible</span>
            <span><i className="lg covered" /> Semi-couvert</span>
            <span><i className="lg indoor" /> Intérieur</span>
            <span><i className="lg outdoor" /> Extérieur</span>
          </div>
        </>
      )}

      {/* Créneau sélectionné */}
      {selected && (
        <div className="booking-sheet">
          <div className="booking-sheet-top">
            <div>
              <div className="sheet-court">
                Terrain {selected.court.number} · {selected.court.name}
              </div>
              <div className="sheet-meta">
                {selectedDate?.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                {' · '}
                {selected.slot.time} → {endTime(selected.slot.time, selected.slot.duration)}
                {' · '}
                {TYPE_LABEL[selected.court.type]}
              </div>
            </div>
            <div className="sheet-price">{formatPrice(selected.slot)}</div>
          </div>
          <a
            className="btn-primary booking-cta"
            href={selected.slot.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Réserver sur Playtomic
          </a>
          <div className="sheet-note">
            La réservation et le paiement se terminent sur Playtomic (connexion requise).
          </div>
          <button type="button" className="sheet-close" onClick={() => setSelected(null)} aria-label="Fermer">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
