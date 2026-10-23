import { RefreshCwIcon } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useHolds } from '@/features/reservations';
import { getErrorMessage } from '@/shared/api/error-messages';
import { ROUTES } from '@/shared/config/routes';
import { useSessionStore } from '@/shared/session/session.store';
import { Button } from '@/shared/ui/button';
import { Laminate } from '@/shared/ui/laminate';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
import { Skeleton } from '@/shared/ui/skeleton';
import { canSelectSeat, canSelectSeats } from '../can-select-seat';
import { useEventSeats, useReserveSelection, useSelectedSeats } from '../hooks';
import { seatAllowance } from '../seat-allowance';
import { isNavigationKey, nextSeat } from '../seat-navigation';
import { ROW_GRID } from '../seat-grid';
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
  // Límite de seats por comprador del evento
  maxSeatsPerUser: number;
  // Evento impreso en el pase: "Rock Night · Nov 10, 2026, 3:00 PM"
  eventLine: string;
  // La API dijo que el evento ya no admite reservas: quien lo muestra debe actualizarlo
  onEventNotActive: () => void;
}

// Con más filas que estas, el mapa ofrece "Jump to row"
const JUMP_TO_ROW_MIN_ROWS = 8;

export function SeatMap({
  eventId,
  eventBookable,
  price,
  maxSeatsPerUser,
  eventLine,
  onEventNotActive,
}: SeatMapProps) {
  const role = useSessionStore((state) => state.role);
  const seatsQuery = useEventSeats(eventId);
  const seats = seatsQuery.data?.data;
  const { selectedLabels, lostSeatLabels } = useSelectedSeats(eventId, seats);
  const toggle = useSeatSelectionStore((state) => state.toggle);
  const holds = useHolds();
  const { reserve, reserving } = useReserveSelection(eventId, maxSeatsPerUser, onEventNotActive);
  const [focusedLabel, setFocusedLabel] = useState<string | null>(null);
  // Se pulsó un seat con el cupo lleno: el pase lo explica en vez de ignorar el toque
  const [fullNotice, setFullNotice] = useState(false);
  const allowance = seatAllowance(maxSeatsPerUser, holds, eventId);
  const holdsHere = holds.filter((hold) => hold.eventId === eventId);
  const selectedLabel = selectedLabels[0] ?? null;
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
  const lostKey = lostSeatLabels.join(',');
  useEffect(() => {
    if (lostKey) focusSeat(tabLabel);
    // Solo reacciona a una pérdida nueva, no a cada cambio de foco
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lostKey]);

  if (seatsQuery.isLoading) {
    return <Skeleton aria-label="Loading seats" className="h-64 rounded-lg" />;
  }

  if (seatsQuery.error || !seats) {
    return (
      <Laminate className="flex flex-col items-start gap-3 p-4 sm:max-w-md">
        <p role="alert" className="font-semibold">
          {getErrorMessage(seatsQuery.error)}
        </p>
        <Button variant="outline" onClick={() => void seatsQuery.refetch()}>
          Try again
        </Button>
      </Laminate>
    );
  }

  const available = seats.filter((seat) => seat.status === SEAT_STATUSES.AVAILABLE).length;
  const showPass = canSelectSeats(selection);
  const rows = groupSeatsByRow(seats);

  // Lleva la fila elegida a la vista y el foco a su primer seat disponible
  const jumpToRow = (row: string) => {
    const group = gridRef.current?.querySelector<HTMLElement>(`[data-row="${row}"]`);
    group?.scrollIntoView({ block: 'center' });
    const first = rows
      .find((candidate) => candidate.row === row)
      ?.seats.find((seat) => canSelectSeat(seat, selection));
    if (first) {
      setFocusedLabel(first.label);
      focusSeat(first.label);
    }
  };

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
      className={showPass ? 'pb-28 lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8 lg:pb-0' : undefined}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="display text-code-md">Seats</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm">
                {available} of {seats.length} seats available
              </span>
              <Button
                variant="outline"
                onClick={() => void seatsQuery.refetch()}
                disabled={seatsQuery.isFetching}
              >
                <RefreshCwIcon aria-hidden="true" />
                Refresh
              </Button>
            </div>
          </div>
          {/* La regla de la reserva se dice antes de elegir (principio 1 del producto) */}
          <p className="text-muted-foreground text-sm">
            {maxSeatsPerUser > 1
              ? `Pick up to ${maxSeatsPerUser} seats. Once reserved, they are held for 10 minutes while you pay.`
              : 'Pick a seat. Once reserved, it is held for 10 minutes while you pay.'}
          </p>
        </div>
        <SeatLegend />
        {rows.length > JUMP_TO_ROW_MIN_ROWS && (
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="jump-to-row">Jump to row</label>
            <NativeSelect
              id="jump-to-row"
              value=""
              onChange={(event) => event.target.value && jumpToRow(event.target.value)}
            >
              <NativeSelectOption value="">Choose</NativeSelectOption>
              {rows.map(({ row }) => (
                <NativeSelectOption key={row} value={row}>
                  {row}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}
        <div className="overflow-x-auto pb-2">
          <div
            ref={gridRef}
            onKeyDown={handleKeyDown}
            className="flex w-full flex-col gap-0.5 sm:w-max sm:gap-1.5"
          >
            <div className={ROW_GRID}>
              <div className="display text-code-sm text-muted-foreground bg-muted col-start-2 col-end-12 grid h-7 place-items-center rounded-t-sm rounded-b-2xl border">
                Stage
              </div>
            </div>
            {rows.map(({ row, seats: rowSeats }) => (
              <div
                key={row}
                role="group"
                aria-label={`Row ${row}`}
                data-row={row}
                className={ROW_GRID}
              >
                <span
                  aria-hidden="true"
                  className="display text-code-sm text-muted-foreground col-start-1 grid place-items-center"
                >
                  {row}
                </span>
                {rowSeats.map((seat) => (
                  <SeatTile
                    key={seat.id}
                    seat={seat}
                    selectable={canSelectSeat(seat, selection)}
                    selected={selectedLabels.includes(seat.label)}
                    focusable={seat.label === tabLabel}
                    onToggle={(label) => setFullNotice(!toggle(eventId, label, allowance))}
                    onFocus={setFocusedLabel}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {showPass && (
        <div className="bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:sticky lg:top-24 lg:self-start lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <SelectionPass
            selectedLabels={selectedLabels}
            lostSeatLabels={lostSeatLabels}
            allowance={allowance}
            price={price}
            eventLine={eventLine}
            reserving={reserving}
            onReserve={() => reserve(selectedLabels)}
            fullNotice={fullNotice}
            held={
              allowance === 0 && holdsHere.length > 0
                ? {
                    count: holdsHere.length,
                    checkoutPath: ROUTES.checkoutFor(holdsHere.map((hold) => hold.reservationId)),
                  }
                : null
            }
          />
        </div>
      )}
    </section>
  );
}
