import { screen, within } from '@testing-library/react';
import { setMedia } from '@/test/media';
import { makeEvent, makeSeats } from '@/test/fixtures/events';
import { setEvents, setSeats } from '@/test/msw/event-handlers';
import { renderRoute, signInAs } from '@/test/render';
import { nextSeat } from './seat-navigation';
import { SEAT_STATUS_STYLE, SELECTED_SEAT_STYLE } from './seat-status-style';
import { useSeatSelectionStore } from './store';
import type { Seat } from './types';

function seed(seats = makeSeats(25), overrides = {}) {
  const event = makeEvent({
    name: 'Rock Night',
    price: 49.99,
    capacity: seats.length,
    ...overrides,
  });
  setEvents([event]);
  setSeats(event.id, seats);
  return event;
}

const always = () => true;
const availableOnly = (seat: Seat) => seat.status === 'AVAILABLE';

describe('seat status style', () => {
  it('gives every state its own symbol', () => {
    const icons = [...Object.values(SEAT_STATUS_STYLE), SELECTED_SEAT_STYLE]
      .map((visual) => visual.icon)
      .filter(Boolean);
    expect(new Set(icons).size).toBe(icons.length);
    expect(icons).toHaveLength(4); // Disponible es el único sin símbolo: su forma es el contorno
  });
});

describe('nextSeat', () => {
  const seats = makeSeats(25, { B3: 'SOLD', A9: 'SOLD', A10: 'SOLD' });

  it('moves along the row with left and right', () => {
    expect(nextSeat(seats, 'A3', 'ArrowRight', always)).toBe('A4');
    expect(nextSeat(seats, 'A3', 'ArrowLeft', always)).toBe('A2');
  });

  it('moves between rows with up and down', () => {
    expect(nextSeat(seats, 'A3', 'ArrowDown', always)).toBe('B3');
    expect(nextSeat(seats, 'B3', 'ArrowUp', always)).toBe('A3');
  });

  it('skips seats that cannot be selected', () => {
    expect(nextSeat(seats, 'A3', 'ArrowDown', availableOnly)).toBe('B2');
    expect(nextSeat(seats, 'A8', 'ArrowRight', availableOnly)).toBe('A8');
  });

  it('lands on the closest seat of a shorter row', () => {
    expect(nextSeat(seats, 'B9', 'ArrowDown', always)).toBe('C5');
  });

  it('stays at the edges', () => {
    expect(nextSeat(seats, 'A1', 'ArrowLeft', always)).toBe('A1');
    expect(nextSeat(seats, 'A1', 'ArrowUp', always)).toBe('A1');
    expect(nextSeat(seats, 'C5', 'ArrowDown', always)).toBe('C5');
  });
});

describe('SeatMap layout', () => {
  afterEach(() => useSeatSelectionStore.getState().clear());

  it('aligns short rows by seat number and marks the stage before row A', async () => {
    signInAs('USER');
    const event = seed();
    renderRoute(`/events/${event.id}`);

    const c1 = await screen.findByRole('button', { name: 'Seat C1, Available' });
    const a1 = screen.getByRole('button', { name: 'Seat A1, Available' });
    expect(c1.style.gridColumnStart).toBe(a1.style.gridColumnStart);

    const stage = screen.getByText('Stage');
    const rowA = screen.getByRole('group', { name: 'Row A' });
    expect(stage.compareDocumentPosition(rowA) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows a symbol for each state in the legend', async () => {
    signInAs('USER');
    const event = seed();
    renderRoute(`/events/${event.id}`);

    const legend = await screen.findByRole('list', { name: 'Legend' });
    expect(within(legend).getAllByRole('listitem')).toHaveLength(5);
    expect(legend.querySelectorAll('svg')).toHaveLength(4);
  });
});

describe('SeatMap keyboard', () => {
  afterEach(() => useSeatSelectionStore.getState().clear());

  it('is a single tab stop navigated with arrows', async () => {
    signInAs('USER');
    const event = seed();
    const { user } = renderRoute(`/events/${event.id}`);
    const refresh = await screen.findByRole('button', { name: 'Refresh' });

    refresh.focus();
    await user.tab();
    expect(document.activeElement).toHaveAccessibleName('Seat A1, Available');

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('Seat B3, Available');

    await user.keyboard('{Enter}');
    expect(useSeatSelectionStore.getState().seatLabel).toBe('B3');

    await user.tab();
    expect(document.activeElement?.getAttribute('data-seat-label')).toBeNull();
  });
});

describe('SelectionPass', () => {
  afterEach(() => useSeatSelectionStore.getState().clear());

  it('invites to pick a seat when nothing is selected', async () => {
    signInAs('USER');
    const event = seed();
    renderRoute(`/events/${event.id}`);

    expect(await screen.findByText('Select an available seat.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reserve' })).not.toBeInTheDocument();
  });

  it('prints the seat and the price, with Reserve enabled', async () => {
    signInAs('USER');
    const event = seed();
    const { user } = renderRoute(`/events/${event.id}`);

    await user.click(await screen.findByRole('button', { name: 'Seat C3, Available' }));

    const reserve = screen.getByRole('button', { name: 'Reserve' });
    const pass = within(reserve.closest<HTMLElement>('[data-slot="laminate"]')!);
    expect(pass.getByText('C3')).toBeInTheDocument();
    expect(pass.getByText('$49.99')).toBeInTheDocument();
    expect(reserve).toBeEnabled();
    expect(reserve).toHaveAccessibleDescription(/Held for 10 minutes once reserved/);
  });

  it('is not shown to an ADMIN', async () => {
    signInAs('ADMIN');
    const event = seed();
    renderRoute(`/events/${event.id}`);

    await screen.findByText(/seats available/);
    expect(screen.queryByText('Select an available seat.')).not.toBeInTheDocument();
  });
});

describe('motion', () => {
  afterEach(() => useSeatSelectionStore.getState().clear());

  it('switches off seat transitions and the pass stamp under reduced motion', async () => {
    signInAs('USER');
    const event = seed();
    const { user } = renderRoute(`/events/${event.id}`);

    const seat = await screen.findByRole('button', { name: 'Seat A2, Available' });
    expect(seat.className).toMatch(/ease-\[steps\(2,end\)\]/);
    expect(seat.className).toContain('motion-reduce:transition-none');

    await user.click(seat);
    const code = screen.getByText('A2', { selector: '.display' });
    expect(code.className).toContain('motion-reduce:animate-none');
  });
});

describe('compact pass on mobile', () => {
  beforeEach(() => setMedia({ wide: false }));
  afterEach(() => useSeatSelectionStore.getState().clear());

  it('shows seat, price and Reserve in one row and keeps the rest under Details', async () => {
    signInAs('USER');
    const event = seed();
    const { user } = renderRoute(`/events/${event.id}`);

    await user.click(await screen.findByRole('button', { name: 'Seat C3, Available' }));

    const reserve = screen.getByRole('button', { name: 'Reserve' });
    expect(reserve).toBeEnabled();
    expect(reserve).toHaveAccessibleDescription(/Held for 10 minutes once reserved/);
    expect(screen.queryByText(/Rock Night · /, { selector: 'p' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Details/ }));
    expect(
      screen.getByText(/Rock Night · /, { selector: 'p.text-muted-foreground' }),
    ).toBeVisible();
  });
});

describe('seat map extras', () => {
  afterEach(() => useSeatSelectionStore.getState().clear());

  it('puts the legend before the stage and explains the hold up front', async () => {
    signInAs('USER');
    const event = seed();
    renderRoute(`/events/${event.id}`);

    const legend = await screen.findByRole('list', { name: 'Legend' });
    const stage = screen.getByText('Stage');
    expect(legend.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      screen.getByText('Pick a seat. Once reserved, it is held for 10 minutes while you pay.'),
    ).toBeInTheDocument();
  });

  it('offers Jump to row on big events and moves focus to that row', async () => {
    signInAs('USER');
    const event = seed(makeSeats(260));
    const { user } = renderRoute(`/events/${event.id}`);

    await user.selectOptions(await screen.findByLabelText('Jump to row'), 'M');

    expect(document.activeElement).toHaveAccessibleName('Seat M1, Available');
  });

  it('hides Jump to row on small events', async () => {
    signInAs('USER');
    const event = seed();
    renderRoute(`/events/${event.id}`);

    await screen.findByText(/seats available/);
    expect(screen.queryByLabelText('Jump to row')).not.toBeInTheDocument();
  });
});
