import { ChevronDownIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { formatMoney } from '@/shared/lib/format-money';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Laminate } from '@/shared/ui/laminate';

interface SelectionPassProps {
  selectedLabel: string | null;
  lostSeatLabel: string | null;
  price: number;
  eventLine: string;
  reserving: boolean;
  onReserve: () => void;
  // Reserva en curso del usuario: mientras exista, no se puede reservar otro seat
  hold: PassHold | null;
}

export interface PassHold {
  seatLabel: string;
  checkoutPath: string;
}

const HOLD_NOTE = 'Held for 10 minutes once reserved';
// Una marca por minuto de la reserva: la regla mide exactamente los 10 minutos
const HOLD_MINUTES = 10;
// Desde este ancho el pase es una columna y muestra todo; por debajo va compacto
export const WIDE_PASS_QUERY = '(min-width: 1024px)';

function seatLostMessage(label: string): string {
  return `${label} was just taken. Pick another seat`;
}

function HoldingNotice({ hold }: { hold: PassHold }) {
  return (
    <p className="text-sm">
      You are holding {hold.seatLabel}. Finish or cancel it to reserve another{' '}
      <Link to={hold.checkoutPath} className="font-semibold underline underline-offset-4">
        Continue to checkout
      </Link>
    </p>
  );
}

function reserveLabel(reserving: boolean): string {
  return reserving ? 'Reserving...' : 'Reserve';
}

function HoldRuler() {
  return (
    <span aria-hidden="true" className="grid grid-cols-10 gap-0.5">
      {Array.from({ length: HOLD_MINUTES }, (_, minute) => (
        <span key={minute} className="bg-tier h-1.5 first:rounded-l-full last:rounded-r-full" />
      ))}
    </span>
  );
}

/** Código del seat con el sello; el `key` repite la animación al cambiar de seat. */
function SeatCode({ label, className }: { label: string; className: string }) {
  return (
    <span
      key={label}
      className={cn(
        'display animate-[stamp_180ms_steps(2,end)] motion-reduce:animate-none',
        className,
      )}
    >
      {label}
    </span>
  );
}

/**
 * Pase de la selección. En escritorio es una columna fija con todo a la vista; en móvil es una
 * sola fila fija abajo (código, precio y Reserve) y el resto va en "Details".
 */
export function SelectionPass(props: SelectionPassProps) {
  const wide = useMediaQuery(WIDE_PASS_QUERY);
  return wide ? <WidePass {...props} /> : <CompactPass {...props} />;
}

function EmptyPass({ lostSeatLabel }: Pick<SelectionPassProps, 'lostSeatLabel'>) {
  return lostSeatLabel ? (
    <p role="alert" className="text-destructive text-sm font-semibold">
      {seatLostMessage(lostSeatLabel)}
    </p>
  ) : (
    <p className="text-sm">
      <span className="font-semibold">Select an available seat.</span>{' '}
      <span className="text-muted-foreground">It will be printed on your pass.</span>
    </p>
  );
}

function WidePass({
  selectedLabel,
  lostSeatLabel,
  price,
  eventLine,
  reserving,
  onReserve,
  hold,
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
            <SeatCode label={selectedLabel} className="text-code-lg block" />
          </div>
          <span className="display text-code-md">{formatMoney(price)}</span>
          <p className="text-muted-foreground col-span-2 truncate text-xs">{eventLine}</p>
          <Button
            className="col-span-2 w-full"
            disabled={reserving || !!hold}
            onClick={onReserve}
            aria-describedby={noteId}
          >
            {reserveLabel(reserving)}
          </Button>
          {hold && (
            <div className="col-span-2">
              <HoldingNotice hold={hold} />
            </div>
          )}
          <div className="text-muted-foreground col-span-2 flex flex-col gap-1.5 text-xs">
            <HoldRuler />
            <span id={noteId}>{HOLD_NOTE}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <EmptyPass lostSeatLabel={lostSeatLabel} />
        </div>
      )}
    </Laminate>
  );
}

function CompactPass({
  selectedLabel,
  lostSeatLabel,
  price,
  eventLine,
  reserving,
  onReserve,
  hold,
}: SelectionPassProps) {
  const noteId = useId();
  const detailsId = useId();
  const [open, setOpen] = useState(false);

  return (
    <Laminate className="px-3 py-3">
      {selectedLabel ? (
        <div className="flex flex-col gap-2">
          <p role="status" className="sr-only">
            Selected seat: {selectedLabel}
          </p>
          <div className="flex items-center gap-3">
            <SeatCode label={selectedLabel} className="text-code-md min-w-12" />
            <span className="display text-code-md">{formatMoney(price)}</span>
            <Button
              className="ml-auto"
              disabled={reserving || !!hold}
              onClick={onReserve}
              aria-describedby={noteId}
            >
              {reserveLabel(reserving)}
            </Button>
          </div>
          {hold && <HoldingNotice hold={hold} />}
          <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
            <span id={noteId}>{HOLD_NOTE}</span>
            <Button
              variant="link"
              size="sm"
              className="h-6 px-0 text-xs"
              aria-expanded={open}
              aria-controls={detailsId}
              onClick={() => setOpen((value) => !value)}
            >
              Details
              <ChevronDownIcon
                aria-hidden="true"
                className={cn('size-3.5', open && 'rotate-180')}
              />
            </Button>
          </div>
          {open && (
            <div
              id={detailsId}
              className="flex flex-col gap-1.5 border-t border-dashed pt-2 text-xs"
            >
              <p className="text-muted-foreground">{eventLine}</p>
              <HoldRuler />
            </div>
          )}
        </div>
      ) : (
        <EmptyPass lostSeatLabel={lostSeatLabel} />
      )}
    </Laminate>
  );
}
