import { format, setHours, setMinutes, startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

interface DateTimeFieldProps {
  // Prefijo de los ids y de los nombres accesibles ("Start" -> "Start date", "Start time")
  label: string;
  id: string;
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  invalid?: boolean;
  disabled?: boolean;
}

const DEFAULT_TIME = '12:00';
const TIME_FORMAT = 'HH:mm';
const DATE_FORMAT = 'PP';

function withTime(day: Date, time: string): Date {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return setMinutes(setHours(startOfDay(day), hours), minutes);
}

/** Día (calendario) y hora (campo de hora) que entregan un `Date` local. */
export function DateTimeField({
  label,
  id,
  value,
  onChange,
  invalid,
  disabled,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  // La hora escrita antes de elegir el día se conserva hasta que haya día
  const [pendingTime, setPendingTime] = useState(DEFAULT_TIME);
  const time = value ? format(value, TIME_FORMAT) : pendingTime;

  const handleDay = (day: Date | undefined) => {
    onChange(day ? withTime(day, time) : undefined);
    if (day) setOpen(false);
  };

  const handleTime = (next: string) => {
    if (!next) return;
    setPendingTime(next);
    if (value) onChange(withTime(value, next));
  };

  return (
    <div className="grid grid-cols-[1fr_8rem] gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className="justify-start font-normal"
            aria-invalid={invalid}
            aria-label={`${label} date${value ? `: ${format(value, DATE_FORMAT)}` : ''}`}
            disabled={disabled}
          >
            <CalendarIcon aria-hidden="true" />
            {value ? format(value, DATE_FORMAT) : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar mode="single" selected={value} onSelect={handleDay} defaultMonth={value} />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        aria-label={`${label} time`}
        aria-invalid={invalid}
        value={time}
        onChange={(event) => handleTime(event.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
