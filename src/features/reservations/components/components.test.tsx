import { act, render, screen } from '@testing-library/react';
import { Countdown } from './Countdown';
import { litSegments } from '../lit-segments';
import { HoldRuler } from './HoldRuler';

const START = new Date('2026-10-22T15:00:00Z');
const MINUTE = 60_000;
const at = (ms: number) => new Date(START.getTime() + ms).toISOString();

function litCount(container: HTMLElement) {
  return container.querySelectorAll('[data-lit="true"]').length;
}

describe('HoldRuler', () => {
  it('lights 8 of 10 segments with 7:42 left of 10:00', () => {
    const { container } = render(<HoldRuler remainingMs={462_000} totalMs={10 * MINUTE} />);
    expect(litCount(container)).toBe(8);
  });

  it('scales to a 5 minute reservation', () => {
    expect(litSegments(2.5 * MINUTE, 5 * MINUTE)).toBe(5);
    expect(litSegments(5 * MINUTE, 5 * MINUTE)).toBe(10);
  });

  it('is empty at zero and never exceeds 10', () => {
    expect(litSegments(0, 10 * MINUTE)).toBe(0);
    expect(litSegments(20 * MINUTE, 10 * MINUTE)).toBe(10);
  });
});

describe('Countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });
  afterEach(() => vi.useRealTimers());

  function renderCountdown(remainingMs: number) {
    return render(<Countdown createdAt={at(0)} expiresAt={at(remainingMs)} />);
  }

  it('hides the time from screen readers and shows it', () => {
    renderCountdown(462_000);
    expect(screen.getByText('07:42')).toHaveAttribute('aria-hidden', 'true');
  });

  it('announces only at 5 minutes, 1 minute and expiry', () => {
    renderCountdown(6 * MINUTE);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    act(() => void vi.advanceTimersByTime(MINUTE + 1000));
    expect(status).toHaveTextContent('Five minutes left to pay');

    act(() => void vi.advanceTimersByTime(2 * MINUTE));
    expect(status).toHaveTextContent('Five minutes left to pay');

    act(() => void vi.advanceTimersByTime(2 * MINUTE));
    expect(status).toHaveTextContent('One minute left to pay');

    act(() => void vi.advanceTimersByTime(MINUTE));
    expect(status).toHaveTextContent('Time is up. This reservation has expired');
  });
});
