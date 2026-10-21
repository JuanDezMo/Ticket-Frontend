import { cn } from '@/shared/lib/utils';
import { SEAT_STATUS_STYLE } from '../seat-status-style';
import type { SeatStatus } from '../types';

const STATUSES = Object.keys(SEAT_STATUS_STYLE) as SeatStatus[];

export function SeatLegend() {
  return (
    <ul aria-label="Legend" className="flex flex-wrap gap-4 text-sm">
      {STATUSES.map((status) => (
        <li key={status} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn('size-4 rounded border', SEAT_STATUS_STYLE[status].className)}
          />
          {SEAT_STATUS_STYLE[status].label}
        </li>
      ))}
    </ul>
  );
}
