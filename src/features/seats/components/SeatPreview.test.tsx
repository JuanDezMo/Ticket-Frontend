import { render, screen } from '@testing-library/react';
import { isPreviewCapacity, previewSeats } from '../preview-seats';
import { SeatPreview } from './SeatPreview';

function rowsOf(container: HTMLElement) {
  return [...container.querySelectorAll('[data-row]')].map((row) => ({
    row: row.getAttribute('data-row'),
    seats: row.querySelectorAll('[role="img"]').length,
  }));
}

describe('SeatPreview', () => {
  it('draws 25 seats in 3 rows with the last one incomplete', () => {
    const { container } = render(<SeatPreview capacity={25} />);

    expect(screen.getByText('25 seats in 3 rows')).toBeInTheDocument();
    expect(rowsOf(container)).toEqual([
      { row: 'A', seats: 10 },
      { row: 'B', seats: 10 },
      { row: 'C', seats: 5 },
    ]);
  });

  it('draws 260 seats in 26 rows, from A to Z', () => {
    const { container } = render(<SeatPreview capacity={260} />);

    expect(screen.getByText('260 seats in 26 rows')).toBeInTheDocument();
    const rows = rowsOf(container);
    expect(rows).toHaveLength(26);
    expect(rows[0]?.row).toBe('A');
    expect(rows.at(-1)?.row).toBe('Z');
  });

  it.each([0, 261, 300, -5, 2.5, Number.NaN])('draws nothing for %s', (capacity) => {
    const { container } = render(<SeatPreview capacity={capacity} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('is not interactive', () => {
    const { container } = render(<SeatPreview capacity={25} />);

    expect(container.querySelectorAll('button, [tabindex]')).toHaveLength(0);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps the seat grid out of the accessibility tree', () => {
    const { container } = render(<SeatPreview capacity={25} />);
    expect(container.querySelector('[data-row]')?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('previewSeats', () => {
  it('numbers seats like the API: A1..A10, B1..', () => {
    const labels = previewSeats(12).map((seat) => seat.label);
    expect(labels).toEqual([
      'A1',
      'A2',
      'A3',
      'A4',
      'A5',
      'A6',
      'A7',
      'A8',
      'A9',
      'A10',
      'B1',
      'B2',
    ]);
  });

  it('accepts only whole numbers from 1 to 260', () => {
    expect([1, 260].every(isPreviewCapacity)).toBe(true);
    expect([0, 261, 1.5, Number.NaN].some(isPreviewCapacity)).toBe(false);
  });
});
