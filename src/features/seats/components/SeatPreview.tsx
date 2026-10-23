import { ROW_GRID } from '../seat-grid';
import { groupSeatsByRow } from '../seat-rows';
import { previewSeats } from '../preview-seats';
import { SeatTile } from './SeatTile';

interface SeatPreviewProps {
  capacity: number;
}

const noop = () => {};

/**
 * Vista previa de los seats que se generarán con esa capacidad. Solo informa: los seats no se
 * pueden enfocar ni elegir, y la rejilla se oculta a lectores de pantalla porque el resumen
 * de texto ya dice lo mismo.
 */
export function SeatPreview({ capacity }: SeatPreviewProps) {
  const rows = groupSeatsByRow(previewSeats(capacity));
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">
        {capacity} seats in {rows.length} rows
      </p>
      <div aria-hidden="true" className="flex flex-col gap-0.5 sm:gap-1.5">
        {rows.map(({ row, seats }) => (
          <div key={row} data-row={row} className={ROW_GRID}>
            <span className="display text-code-sm text-muted-foreground col-start-1 grid place-items-center">
              {row}
            </span>
            {seats.map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                selectable={false}
                selected={false}
                focusable={false}
                onToggle={noop}
                onFocus={noop}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
