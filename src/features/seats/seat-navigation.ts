import type { Seat } from './types';

export const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] as const;
export type NavigationKey = (typeof NAVIGATION_KEYS)[number];

export function isNavigationKey(key: string): key is NavigationKey {
  return (NAVIGATION_KEYS as readonly string[]).includes(key);
}

/**
 * Seat al que pasa el foco con una flecha. Solo se aterriza en seats seleccionables:
 * izquierda/derecha recorren la fila; arriba/abajo van a la fila vecina más cercana
 * con algún seat seleccionable y eligen el de número más próximo. Sin destino, se queda.
 */
export function nextSeat(
  seats: Seat[],
  currentLabel: string,
  key: NavigationKey,
  isSelectable: (seat: Seat) => boolean,
): string {
  const current = seats.find((seat) => seat.label === currentLabel);
  if (!current) return currentLabel;
  const candidates = seats.filter(isSelectable);

  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const step = key === 'ArrowRight' ? 1 : -1;
    const inRow = candidates
      .filter((seat) => seat.row === current.row && (seat.number - current.number) * step > 0)
      .sort((a, b) => (a.number - b.number) * step);
    return inRow[0]?.label ?? currentLabel;
  }

  const rows = [...new Set(seats.map((seat) => seat.row))];
  const step = key === 'ArrowDown' ? 1 : -1;
  for (
    let index = rows.indexOf(current.row) + step;
    index >= 0 && index < rows.length;
    index += step
  ) {
    const inRow = candidates.filter((seat) => seat.row === rows[index]);
    if (inRow.length > 0) {
      const closest = inRow.reduce((best, seat) =>
        Math.abs(seat.number - current.number) < Math.abs(best.number - current.number)
          ? seat
          : best,
      );
      return closest.label;
    }
  }
  return currentLabel;
}
