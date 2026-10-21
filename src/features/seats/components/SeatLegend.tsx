import { cn } from '@/shared/lib/utils';
import { SEAT_STATUS_STYLE, SELECTED_SEAT_STYLE } from '../seat-status-style';
import type { SeatStatus } from '../types';

const ENTRIES = [
  ...(Object.keys(SEAT_STATUS_STYLE) as SeatStatus[]).map((status) => SEAT_STATUS_STYLE[status]),
  SELECTED_SEAT_STYLE,
];

export function SeatLegend() {
  return (
    <ul aria-label="Legend" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {ENTRIES.map(({ label, className, icon: Icon }) => (
        <li key={label} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn('grid size-5 place-items-center rounded-sm border-2', className)}
          >
            {Icon && <Icon className="size-3" strokeWidth={3} />}
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}
