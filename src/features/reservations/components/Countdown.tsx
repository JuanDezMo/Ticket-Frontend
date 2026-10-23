import { formatRemaining } from '../format-remaining';
import { useCountdown } from '../use-countdown';
import { HoldRuler } from './HoldRuler';

interface CountdownProps {
  createdAt: string;
  expiresAt: string;
  onExpire?: () => void;
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

// Lo que anuncia el lector de pantalla, nunca cada segundo: solo al cruzar estos umbrales
const ANNOUNCEMENTS = [
  { upToMs: 0, message: 'Time is up. This reservation has expired' },
  { upToMs: ONE_MINUTE_MS, message: 'One minute left to pay' },
  { upToMs: FIVE_MINUTES_MS, message: 'Five minutes left to pay' },
];

function announcementFor(remainingMs: number): string {
  return ANNOUNCEMENTS.find((item) => remainingMs <= item.upToMs)?.message ?? '';
}

/** Tiempo restante y regla de 10 tramos de la reserva. */
export function Countdown({ createdAt, expiresAt, onExpire }: CountdownProps) {
  const remainingMs = useCountdown(expiresAt, onExpire);
  const totalMs = new Date(expiresAt).getTime() - new Date(createdAt).getTime();

  return (
    <span className="flex flex-col gap-1.5">
      <span aria-hidden="true" className="display text-code-md">
        {formatRemaining(remainingMs)}
      </span>
      <HoldRuler remainingMs={remainingMs} totalMs={totalMs} />
      <span role="status" className="sr-only">
        {announcementFor(remainingMs)}
      </span>
    </span>
  );
}
