const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

/** "07:42" para 7 minutos y 42 segundos; redondea hacia arriba para no mostrar 00:00 antes de tiempo. */
export function formatRemaining(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / MS_PER_SECOND));
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
