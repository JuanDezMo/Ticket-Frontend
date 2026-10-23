import { useEffect, useRef, useState } from 'react';

const TICK_MS = 1000;

function remainingUntil(expiresAt: string): number {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

/**
 * Milisegundos que faltan hasta `expiresAt`. Cada segundo vuelve a leer el reloj (no suma
 * pasos), así no se desfasa si la pestaña estuvo en segundo plano. Avisa una sola vez al llegar a cero.
 */
export function useCountdown(expiresAt: string, onExpire?: () => void): number {
  const [remainingMs, setRemainingMs] = useState(() => remainingUntil(expiresAt));
  const onExpireRef = useRef(onExpire);
  const notified = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    notified.current = false;
    const update = () => setRemainingMs(remainingUntil(expiresAt));
    update();
    const timer = setInterval(update, TICK_MS);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, [expiresAt]);

  useEffect(() => {
    if (remainingMs === 0 && !notified.current) {
      notified.current = true;
      onExpireRef.current?.();
    }
  }, [remainingMs]);

  return remainingMs;
}
