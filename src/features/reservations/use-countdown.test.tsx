import { act, renderHook } from '@testing-library/react';
import { formatRemaining } from './format-remaining';
import { useCountdown } from './use-countdown';

const START = new Date('2026-10-22T15:00:00Z');
const expiresIn = (ms: number) => new Date(START.getTime() + ms).toISOString();

describe('formatRemaining', () => {
  it('formats minutes and seconds', () => {
    expect(formatRemaining(7 * 60_000 + 42_000)).toBe('07:42');
    expect(formatRemaining(9_000)).toBe('00:09');
    expect(formatRemaining(0)).toBe('00:00');
  });

  it('never goes below zero', () => {
    expect(formatRemaining(-5_000)).toBe('00:00');
  });

  it('rounds up so it does not show 00:00 early', () => {
    expect(formatRemaining(400)).toBe('00:01');
  });
});

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });
  afterEach(() => vi.useRealTimers());

  it('starts with the remaining time', () => {
    const { result } = renderHook(() => useCountdown(expiresIn(462_000)));
    expect(formatRemaining(result.current)).toBe('07:42');
  });

  it('updates every second', () => {
    const { result } = renderHook(() => useCountdown(expiresIn(462_000)));
    act(() => void vi.advanceTimersByTime(1000));
    expect(formatRemaining(result.current)).toBe('07:41');
  });

  it('recovers the right time after the tab was paused', () => {
    const { result } = renderHook(() => useCountdown(expiresIn(600_000)));
    // La pestaña estuvo en segundo plano 3 minutos y el reloj siguió avanzando
    act(() => {
      vi.setSystemTime(new Date(START.getTime() + 180_000));
      vi.advanceTimersByTime(1000);
    });
    expect(formatRemaining(result.current)).toBe('06:59');
  });

  it('notifies once when it reaches zero', () => {
    const onExpire = vi.fn();
    renderHook(() => useCountdown(expiresIn(2000), onExpire));
    expect(onExpire).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(2000));
    expect(onExpire).toHaveBeenCalledTimes(1);

    act(() => void vi.advanceTimersByTime(5000));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
