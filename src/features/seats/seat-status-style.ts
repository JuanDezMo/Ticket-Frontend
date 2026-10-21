import { CheckIcon, ClockIcon, LockIcon, XIcon, type LucideIcon } from 'lucide-react';
import type { SeatStatus } from './types';

interface SeatVisual {
  label: string;
  // Forma y color del seat; los colores salen de las variables de cada tema (index.css)
  className: string;
  // Símbolo en la esquina: el estado no depende solo del color
  icon: LucideIcon | null;
  // Fondo sólido bajo el número cuando la forma es un patrón (rayado)
  numberClassName?: string;
}

// Un estado nuevo es una entrada más; el texto también va en el nombre accesible
export const SEAT_STATUS_STYLE: Record<SeatStatus, SeatVisual> = {
  AVAILABLE: {
    label: 'Available',
    className: 'border-seat-available-border bg-seat-available-bg text-seat-available-fg',
    icon: null,
  },
  RESERVED: {
    label: 'Reserved',
    className:
      'border-seat-reserved-border bg-seat-reserved-bg text-seat-reserved-fg bg-[repeating-linear-gradient(135deg,var(--seat-reserved-hatch)_0_4px,transparent_4px_9px)]',
    icon: ClockIcon,
    numberClassName: 'rounded-sm bg-seat-reserved-bg px-0.5',
  },
  SOLD: {
    label: 'Sold',
    className: 'border-seat-sold-border bg-seat-sold-bg text-seat-sold-fg',
    icon: XIcon,
  },
  BLOCKED: {
    label: 'Blocked',
    className: 'border-dashed border-seat-blocked-border bg-seat-blocked-bg text-seat-blocked-fg',
    icon: LockIcon,
  },
};

export const SELECTED_SEAT_STYLE: SeatVisual = {
  label: 'Selected',
  className:
    'border-seat-selected-border bg-seat-selected-bg text-seat-selected-fg shadow-[0_0_0_2px_var(--seat-selected-bg)]',
  icon: CheckIcon,
};
