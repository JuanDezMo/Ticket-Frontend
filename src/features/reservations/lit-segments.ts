export const SEGMENTS = 10;

/** Cuántos de los 10 tramos siguen encendidos; la regla se consume en proporción al tiempo total. */
export function litSegments(remainingMs: number, totalMs: number): number {
  if (totalMs <= 0 || remainingMs <= 0) return 0;
  return Math.min(SEGMENTS, Math.ceil(remainingMs / (totalMs / SEGMENTS)));
}
