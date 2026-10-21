import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from './use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('updates only after the value stops changing for the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'r' },
    });

    rerender({ value: 'ro' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'rock' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('r');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('rock');
  });
});
