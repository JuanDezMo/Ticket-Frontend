import type { SeatStatus } from './types';

interface SeatStatusStyle {
  label: string;
  className: string;
}

// Un estado nuevo es una entrada más; el texto también va en el nombre accesible
export const SEAT_STATUS_STYLE: Record<SeatStatus, SeatStatusStyle> = {
  AVAILABLE: {
    label: 'Available',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  },
  RESERVED: {
    label: 'Reserved',
    className: 'border-amber-300 bg-amber-100 text-amber-900',
  },
  SOLD: {
    label: 'Sold',
    className: 'border-slate-400 bg-slate-300 text-slate-700',
  },
  BLOCKED: {
    label: 'Blocked',
    className: 'border-red-300 bg-red-100 text-red-800 line-through',
  },
};

export const SELECTED_SEAT_CLASS = 'border-primary bg-primary text-primary-foreground';
