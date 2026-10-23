import { ChevronDownIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { formatMoney } from '@/shared/lib/format-money';
import { joinLabels, totalPrice } from '../seat-allowance';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Laminate } from '@/shared/ui/laminate';

interface SelectionPassProps {
  selectedLabels: string[];
  lostSeatLabels: string[];
  // Cuántos seats puede elegir en total el usuario en este evento (límite menos lo que ya retiene)
  allowance: number;
  price: number;
  eventLine: string;
  reserving: boolean;
  onReserve: () => void;
  // Se pulsó un seat con el cupo lleno
  fullNotice: boolean;
  // Solo si el usuario ya retiene el máximo del evento: no se puede reservar más
  held: PassHold | null;
}

export interface PassHold {
  count: number;
  checkoutPath: string;
}

const HOLD_NOTE = 'Held for 10 minutes once reserved';
// Una marca por minuto de la reserva: la regla mide exactamente los 10 minutos
const HOLD_MINUTES = 10;
// Desde este ancho el pase es una columna y muestra todo; por debajo va compacto
export const WIDE_PASS_QUERY = '(min-width: 1024px)';

// En móvil el pase cabe en una fila: se muestran estos códigos y el resto como "+N"
const COMPACT_CODES = 3;

function seatLostMessage(labels: string[]): string {
  return labels.length === 1
    ? `${labels[0]} was just taken. Pick another seat`
    : `${joinLabels(labels)} were just taken. Pick other seats`;
}

function HoldingNotice({ hold }: { hold: PassHold }) {
  return (
    <p className="text-sm">
      You are holding {hold.count} {hold.count === 1 ? 'seat' : 'seats'}, the most for this event.
      Finish or cancel {hold.count === 1 ? 'it' : 'them'} to reserve more{' '}
      <Link to={hold.checkoutPath} className="font-semibold underline underline-offset-4">
        Continue to checkout
      </Link>
    </p>
  );
}

function reserveLabel(reserving: boolean, count: number): string {
  if (reserving) return 'Reserving...';
  return count > 1 ? `Reserve ${count} seats` : 'Reserve';
}

/** Avisos bajo el pase: seats perdidos, cupo lleno y cuántos se eligieron. */
function PassNotices({
  lostSeatLabels,
  fullNotice,
  allowance,
  count,
}: Pick<SelectionPassProps, 'lostSeatLabels' | 'fullNotice' | 'allowance'> & { count: number }) {
  return (
    <>
      {lostSeatLabels.length > 0 && (
        <p role="alert" className="text-destructive text-sm font-semibold">
          {seatLostMessage(lostSeatLabels)}
        </p>
      )}
      {fullNotice && (
        <p role="status" className="text-sm font-semibold">
          You can select up to {allowance} seats
        </p>
      )}
      {allowance > 1 && count > 0 && (
        <p className="text-muted-foreground text-xs">
          {count} of {allowance} seats selected
        </p>
      )}
    </>
  );
}

function selectedAnnouncement(labels: string[]): string {
  return labels.length === 1
    ? `Selected seat: ${labels[0]}`
    : `Selected seats: ${labels.join(', ')}`;
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

function EmptyPass({ lostSeatLabels, held }: Pick<SelectionPassProps, 'lostSeatLabels' | 'held'>) {
  if (held) {
    return (
      <div className="flex flex-col gap-2">
        <Button disabled className="w-full">
          Reserve
        </Button>
        <HoldingNotice hold={held} />
      </div>
    );
  }
  return lostSeatLabels.length > 0 ? (
    <p role="alert" className="text-destructive text-sm font-semibold">
      {seatLostMessage(lostSeatLabels)}
    </p>
  ) : (
    <p className="text-sm">
      <span className="font-semibold">Select an available seat.</span>{' '}
      <span className="text-muted-foreground">It will be printed on your pass.</span>
    </p>
  );
}

function WidePass(props: SelectionPassProps) {
  const { selectedLabels, price, eventLine, reserving, onReserve, held } = props;
  const noteId = useId();
  const count = selectedLabels.length;

  return (
    <Laminate punched className="px-4 pt-8 pb-4">
      {count > 0 ? (
        <div className="grid grid-cols-[1fr_auto] items-end gap-x-4 gap-y-2">
          {/* Anuncia la selección a lectores de pantalla */}
          <p role="status" className="sr-only">
            {selectedAnnouncement(selectedLabels)}
          </p>
          <div className="min-w-0">
            <span className="text-muted-foreground text-xs">{count === 1 ? 'Seat' : 'Seats'}</span>
            <SeatCode
              label={selectedLabels.join(', ')}
              className={cn('block', count === 1 ? 'text-code-lg' : 'text-code-md break-words')}
            />
          </div>
          <span className="display text-code-md">{formatMoney(totalPrice(price, count))}</span>
          <p className="text-muted-foreground col-span-2 truncate text-xs">{eventLine}</p>
          <Button
            className="col-span-2 w-full"
            disabled={reserving || !!held}
            onClick={onReserve}
            aria-describedby={noteId}
          >
            {reserveLabel(reserving, count)}
          </Button>
          <div className="col-span-2 flex flex-col gap-1">
            <PassNotices {...props} count={count} />
          </div>
          <div className="text-muted-foreground col-span-2 flex flex-col gap-1.5 text-xs">
            <HoldRuler />
            <span id={noteId}>{HOLD_NOTE}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <EmptyPass lostSeatLabels={props.lostSeatLabels} held={held} />
          {props.fullNotice && <PassNotices {...props} count={0} lostSeatLabels={[]} />}
        </div>
      )}
    </Laminate>
  );
}

function CompactPass(props: SelectionPassProps) {
  const { selectedLabels, price, eventLine, reserving, onReserve, held } = props;
  const noteId = useId();
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  const count = selectedLabels.length;
  const shown = selectedLabels.slice(0, COMPACT_CODES).join(', ');
  const hidden = count - COMPACT_CODES;

  return (
    <Laminate className="px-3 py-3">
      {count > 0 ? (
        <div className="flex flex-col gap-2">
          <p role="status" className="sr-only">
            {selectedAnnouncement(selectedLabels)}
          </p>
          <div className="flex items-center gap-3">
            <SeatCode label={shown} className="text-code-md min-w-12" />
            {hidden > 0 && <span className="text-muted-foreground text-sm">+{hidden}</span>}
            <span className="display text-code-md">{formatMoney(totalPrice(price, count))}</span>
            <Button
              className="ml-auto"
              disabled={reserving || !!held}
              onClick={onReserve}
              aria-describedby={noteId}
            >
              {reserveLabel(reserving, count)}
            </Button>
          </div>
          <PassNotices {...props} count={count} />
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
              {count > 1 && (
                <p className="text-muted-foreground">Seats: {selectedLabels.join(', ')}</p>
              )}
              <HoldRuler />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <EmptyPass lostSeatLabels={props.lostSeatLabels} held={held} />
          {props.fullNotice && <PassNotices {...props} count={0} lostSeatLabels={[]} />}
        </div>
      )}
    </Laminate>
  );
}
