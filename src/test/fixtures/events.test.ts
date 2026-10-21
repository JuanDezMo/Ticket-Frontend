import { makeSeats } from './events';

describe('makeSeats', () => {
  it('builds rows of 10 like the API', () => {
    const seats = makeSeats(25, { C5: 'SOLD' });

    expect(seats).toHaveLength(25);
    expect(seats.filter((seat) => seat.row === 'C')).toHaveLength(5);
    expect(seats.at(-1)).toMatchObject({ label: 'C5', status: 'SOLD' });
  });
});
