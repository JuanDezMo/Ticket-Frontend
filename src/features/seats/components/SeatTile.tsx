import { cn } from '@/shared/lib/utils';
import { SEAT_STATUS_STYLE, SELECTED_SEAT_CLASS } from '../seat-status-style';
import type { Seat } from '../types';

interface SeatTileProps {
  seat: Seat;
  selectable: boolean;
  selected: boolean;
  onToggle: (label: string) => void;
}

const BASE_CLASS =
  'flex size-9 items-center justify-center rounded-md border text-xs font-medium sm:size-10';

export function SeatTile({ seat, selectable, selected, onToggle }: SeatTileProps) {
  const style = SEAT_STATUS_STYLE[seat.status];
  const name = `Seat ${seat.label}, ${selected ? 'Selected' : style.label}`;
  const className = cn(BASE_CLASS, selected ? SELECTED_SEAT_CLASS : style.className);

  // Solo los seats que se pueden elegir son botones; el resto es informativo
  if (!selectable) {
    return (
      <span role="img" aria-label={name} title={name} className={className}>
        {seat.number}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={selected}
      title={name}
      onClick={() => onToggle(seat.label)}
      className={cn(className, 'hover:ring-ring cursor-pointer hover:ring-2')}
    >
      {seat.number}
    </button>
  );
}
