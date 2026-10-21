import { useId } from 'react';
import { formatMoney } from '@/shared/lib/format-money';
import { Button } from '@/shared/ui/button';
import { Laminate } from '@/shared/ui/laminate';

interface SelectionPassProps {
  selectedLabel: string | null;
  lostSeatLabel: string | null;
  price: number;
  eventLine: string;
}

const HOLD_NOTE = 'Held for 10 minutes once reserved';
// Una marca por minuto de la reserva: la regla mide exactamente los 10 minutos
const HOLD_MINUTES = 10;

function seatLostMessage(label: string): string {
  return `${label} was just taken. Pick another seat`;
}

/** Pase de la selección: fijo abajo en móvil, columna fija en escritorio. */
export function SelectionPass({
  selectedLabel,
  lostSeatLabel,
  price,
  eventLine,
}: SelectionPassProps) {
  const noteId = useId();

  return (
    <Laminate punched className="px-4 pt-8 pb-4">
      {selectedLabel ? (
        <div className="grid grid-cols-[1fr_auto] items-end gap-x-4 gap-y-2">
          {/* Anuncia la selección a lectores de pantalla */}
          <p role="status" className="sr-only">
            Selected seat: {selectedLabel}
          </p>
          <div>
            <span className="text-muted-foreground text-xs">Seat</span>
            <span
              key={selectedLabel}
              className="display text-code-lg block animate-[stamp_180ms_steps(2,end)] motion-reduce:animate-none"
            >
              {selectedLabel}
            </span>
          </div>
          <span className="display text-code-md">{formatMoney(price)}</span>
          <p className="text-muted-foreground col-span-2 truncate text-xs">{eventLine}</p>
          <Button className="col-span-2 w-full" disabled aria-describedby={noteId}>
            Reserve
          </Button>
          <div className="text-muted-foreground col-span-2 flex flex-col gap-1.5 text-xs">
            {/* Regla de la reserva: 10 tramos de un minuto; se activa en web-purchase */}
            <span aria-hidden="true" className="grid grid-cols-10 gap-0.5">
              {Array.from({ length: HOLD_MINUTES }, (_, minute) => (
                <span
                  key={minute}
                  className="bg-tier h-1.5 first:rounded-l-full last:rounded-r-full"
                />
              ))}
            </span>
            <span id={noteId}>{HOLD_NOTE} · Coming soon</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1 text-sm">
          {lostSeatLabel ? (
            <p role="alert" className="text-destructive font-semibold">
              {seatLostMessage(lostSeatLabel)}
            </p>
          ) : (
            <p className="text-foreground font-semibold">Select an available seat.</p>
          )}
          <p className="text-muted-foreground">It will be printed on your pass.</p>
        </div>
      )}
    </Laminate>
  );
}
