import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { DateTimeField } from './date-time-field';

function Harness({ initial, onChange }: { initial?: Date; onChange: (value?: Date) => void }) {
  const [value, setValue] = useState<Date | undefined>(initial);
  return (
    <DateTimeField
      id="start"
      label="Start"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('DateTimeField', () => {
  it('delivers the chosen day with the time', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={new Date(2026, 10, 10, 20, 0)} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Start date/ }));
    await user.click(await screen.findByRole('button', { name: /November 15th, 2026/ }));

    const last = onChange.mock.calls.at(-1)?.[0] as Date;
    expect([last.getFullYear(), last.getMonth(), last.getDate()]).toEqual([2026, 10, 15]);
    expect([last.getHours(), last.getMinutes()]).toEqual([20, 0]);
  });

  it('closes the calendar after choosing a day', async () => {
    const user = userEvent.setup();
    render(<Harness initial={new Date(2026, 10, 10, 20, 0)} onChange={() => {}} />);

    await user.click(screen.getByRole('button', { name: /Start date/ }));
    await user.click(await screen.findByRole('button', { name: /November 15th, 2026/ }));

    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start date: Nov 15, 2026/ })).toBeInTheDocument();
  });

  it('changes the time without changing the day', () => {
    const onChange = vi.fn();
    render(<Harness initial={new Date(2026, 10, 10, 20, 0)} onChange={onChange} />);

    const time = screen.getByLabelText('Start time');
    fireEvent.change(time, { target: { value: '09:30' } });

    const last = onChange.mock.calls.at(-1)?.[0] as Date;
    expect([last.getDate(), last.getHours(), last.getMinutes()]).toEqual([10, 9, 30]);
  });

  it('keeps the time typed before choosing the day', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    const time = screen.getByLabelText('Start time');
    fireEvent.change(time, { target: { value: '18:45' } });
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Start date/ }));
    const days = await screen.findAllByRole('button', { name: /, 2\d{3}$/ });
    await user.click(days.find((day) => !day.hasAttribute('disabled')) as HTMLElement);

    const last = onChange.mock.calls.at(-1)?.[0] as Date;
    expect([last.getHours(), last.getMinutes()]).toEqual([18, 45]);
  });

  it('is operable with the keyboard', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={new Date(2026, 10, 10, 20, 0)} onChange={onChange} />);

    screen.getByRole('button', { name: /Start date/ }).focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('grid')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });
});
