import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/utils';
import { SEAT_STATUS_STYLE, SELECTED_SEAT_STYLE } from '../seat-status-style';
import type { Seat } from '../types';

interface SeatTileProps {
  seat: Seat;
  selectable: boolean;
  selected: boolean;
  // Solo un seat del mapa recibe el Tab; el resto se alcanza con flechas
  focusable: boolean;
  onToggle: (label: string) => void;
  onFocus: (label: string) => void;
}

const BASE_CLASS =
  'relative grid aspect-square w-full place-items-center rounded-md border-2 text-xs font-semibold tabular-nums transition-colors duration-[90ms] ease-[steps(2,end)] motion-reduce:transition-none sm:size-10 sm:text-sm';

export function SeatTile({
  seat,
  selectable,
  selected,
  focusable,
  onToggle,
  onFocus,
}: SeatTileProps) {
  const visual = selected ? SELECTED_SEAT_STYLE : SEAT_STATUS_STYLE[seat.status];
  const name = `Seat ${seat.label}, ${visual.label}`;
  const Icon = visual.icon;
  // La columna sale del número: las filas incompletas quedan alineadas con las completas
  const style: CSSProperties = { gridColumnStart: seat.number + 1 };
  const content = (
    <>
      <span className={visual.numberClassName}>{seat.number}</span>
      {Icon && (
        <Icon
          aria-hidden="true"
          className="absolute top-px right-px size-2.5 sm:top-0.5 sm:right-0.5 sm:size-3"
          strokeWidth={3}
        />
      )}
    </>
  );

  // Solo los seats que se pueden elegir son botones; el resto es informativo
  if (!selectable) {
    return (
      <span role="img" aria-label={name} style={style} className={cn(BASE_CLASS, visual.className)}>
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={selected}
      tabIndex={focusable ? 0 : -1}
      data-seat-label={seat.label}
      style={style}
      onClick={() => onToggle(seat.label)}
      onFocus={() => onFocus(seat.label)}
      className={cn(BASE_CLASS, visual.className, 'cursor-pointer hover:border-foreground')}
    >
      {content}
    </button>
  );
}
