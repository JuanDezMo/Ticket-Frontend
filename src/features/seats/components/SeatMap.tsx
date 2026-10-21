import { RefreshCwIcon } from 'lucide-react';
import { getErrorMessage } from '@/shared/api/error-messages';
import { useSessionStore } from '@/shared/session/session.store';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { canSelectSeat, canSelectSeats } from '../can-select-seat';
import { useEventSeats, useSelectedSeat } from '../hooks';
import { groupSeatsByRow } from '../seat-rows';
import { useSeatSelectionStore } from '../store';
import { SEAT_STATUSES } from '../types';
import { SeatLegend } from './SeatLegend';
import { SeatSelectionSummary } from './SeatSelectionSummary';
import { SeatTile } from './SeatTile';

interface SeatMapProps {
  eventId: string;
  // false si el evento está cancelado o ya inició: nadie puede elegir seats
  eventBookable: boolean;
}

export function SeatMap({ eventId, eventBookable }: SeatMapProps) {
  const role = useSessionStore((state) => state.role);
  const seatsQuery = useEventSeats(eventId);
  const seats = seatsQuery.data?.data;
  const { selectedLabel, lostSeatLabel } = useSelectedSeat(eventId, seats);
  const toggle = useSeatSelectionStore((state) => state.toggle);

  if (seatsQuery.isLoading) {
    return <Skeleton aria-label="Loading seats" className="h-48 rounded-xl" />;
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
  const selection = { role, eventBookable };

  return (
    <section aria-label="Seat map" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Seats</h2>
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
      <SeatLegend />
      <div className="flex flex-col gap-2 overflow-x-auto pb-2">
        {groupSeatsByRow(seats).map(({ row, seats: rowSeats }) => (
          <div key={row} role="group" aria-label={`Row ${row}`} className="flex items-center gap-2">
            <span aria-hidden="true" className="text-muted-foreground w-5 text-sm font-medium">
              {row}
            </span>
            {rowSeats.map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                selectable={canSelectSeat(seat, selection)}
                selected={seat.label === selectedLabel}
                onToggle={(label) => toggle(eventId, label)}
              />
            ))}
          </div>
        ))}
      </div>
      {/* El resumen solo tiene sentido para quien puede elegir */}
      {canSelectSeats(selection) && (
        <SeatSelectionSummary selectedLabel={selectedLabel} lostSeatLabel={lostSeatLabel} />
      )}
    </section>
  );
}
