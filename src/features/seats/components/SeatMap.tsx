import { RefreshCwIcon } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { getErrorMessage } from '@/shared/api/error-messages';
import { useSessionStore } from '@/shared/session/session.store';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { canSelectSeat, canSelectSeats } from '../can-select-seat';
import { useEventSeats, useSelectedSeat } from '../hooks';
import { isNavigationKey, nextSeat } from '../seat-navigation';
import { groupSeatsByRow } from '../seat-rows';
import { useSeatSelectionStore } from '../store';
import { SEAT_STATUSES } from '../types';
import { SeatLegend } from './SeatLegend';
import { SeatTile } from './SeatTile';
import { SelectionPass } from './SelectionPass';

interface SeatMapProps {
  eventId: string;
  // false si el evento está cancelado o ya inició: nadie puede elegir seats
  eventBookable: boolean;
  price: number;
  // Evento impreso en el pase: "Rock Night · Nov 10, 2026, 3:00 PM"
  eventLine: string;
}

// Letra de la fila + 10 columnas fijas: el número N siempre cae en la misma columna
const ROW_GRID =
  'grid grid-cols-[1.75rem_repeat(10,2.75rem)] gap-1.5 sm:grid-cols-[1.75rem_repeat(10,2.5rem)]';

export function SeatMap({ eventId, eventBookable, price, eventLine }: SeatMapProps) {
  const role = useSessionStore((state) => state.role);
  const seatsQuery = useEventSeats(eventId);
  const seats = seatsQuery.data?.data;
  const { selectedLabel, lostSeatLabel } = useSelectedSeat(eventId, seats);
  const toggle = useSeatSelectionStore((state) => state.toggle);
  const [focusedLabel, setFocusedLabel] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const selection = { role, eventBookable };
  const selectable = (seats ?? []).filter((seat) => canSelectSeat(seat, selection));
  const isSelectableLabel = (label: string | null) =>
    !!label && selectable.some((seat) => seat.label === label);
  // Única parada de Tab del mapa: el seat con foco, el seleccionado o el primero disponible
  const tabLabel = isSelectableLabel(focusedLabel)
    ? focusedLabel
    : isSelectableLabel(selectedLabel)
      ? selectedLabel
      : (selectable[0]?.label ?? null);

  const focusSeat = (label: string | null) => {
    if (!label) return;
    gridRef.current?.querySelector<HTMLElement>(`[data-seat-label="${label}"]`)?.focus();
  };

  // Si el seat se perdió, el foco vuelve al mapa para elegir otro
  useEffect(() => {
    if (lostSeatLabel) focusSeat(tabLabel);
    // Solo reacciona a una pérdida nueva, no a cada cambio de foco
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lostSeatLabel]);

  if (seatsQuery.isLoading) {
    return <Skeleton aria-label="Loading seats" className="h-64 rounded-lg" />;
  }

  if (seatsQuery.error || !seats) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p role="alert">{getErrorMessage(seatsQuery.error)}</p>
        <Button variant="outline" onClick={() => void seatsQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const available = seats.filter((seat) => seat.status === SEAT_STATUSES.AVAILABLE).length;
  const showPass = canSelectSeats(selection);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isNavigationKey(event.key) || !tabLabel) return;
    event.preventDefault();
    const target = nextSeat(seats, tabLabel, event.key, (seat) => canSelectSeat(seat, selection));
    setFocusedLabel(target);
    focusSeat(target);
  };

  return (
    <section
      aria-label="Seat map"
      className={showPass ? 'pb-56 lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8 lg:pb-0' : undefined}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="display text-code-md">Seats</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm">
              {available} of {seats.length} seats available
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void seatsQuery.refetch()}
              disabled={seatsQuery.isFetching}
            >
              <RefreshCwIcon aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div ref={gridRef} onKeyDown={handleKeyDown} className="flex w-max flex-col gap-1.5">
            <div className={ROW_GRID}>
              <div className="display text-code-sm text-muted-foreground bg-muted col-start-2 col-end-12 grid h-7 place-items-center rounded-t-sm rounded-b-2xl border">
                Stage
              </div>
            </div>
            {groupSeatsByRow(seats).map(({ row, seats: rowSeats }) => (
              <div key={row} role="group" aria-label={`Row ${row}`} className={ROW_GRID}>
                <span
                  aria-hidden="true"
                  className="display text-code-sm text-muted-foreground bg-background sticky left-0 z-10 col-start-1 grid place-items-center"
                >
                  {row}
                </span>
                {rowSeats.map((seat) => (
                  <SeatTile
                    key={seat.id}
                    seat={seat}
                    selectable={canSelectSeat(seat, selection)}
                    selected={seat.label === selectedLabel}
                    focusable={seat.label === tabLabel}
                    onToggle={(label) => toggle(eventId, label)}
                    onFocus={setFocusedLabel}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <SeatLegend />
      </div>
      {showPass && (
        <div className="bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:sticky lg:top-24 lg:self-start lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <SelectionPass
            selectedLabel={selectedLabel}
            lostSeatLabel={lostSeatLabel}
            price={price}
            eventLine={eventLine}
          />
        </div>
      )}
    </section>
  );
}
