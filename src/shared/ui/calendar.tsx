import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { DayPicker, type ChevronProps } from 'react-day-picker';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

type CalendarProps = ComponentProps<typeof DayPicker>;

function Chevron({ orientation }: ChevronProps) {
  const Icon = orientation === 'left' ? ChevronLeftIcon : ChevronRightIcon;
  return <Icon aria-hidden="true" className="size-4" />;
}

// Cada día mide 44 px en móvil (36 desde `sm`), como el resto de los objetivos táctiles
const DAY_SIZE = 'size-11 sm:size-9';

/** Calendario de un mes con los colores del sistema: naranja solo en el día elegido. */
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-1', className)}
      components={{ Chevron }}
      classNames={{
        root: 'w-fit',
        months: 'relative flex flex-col gap-2',
        month: 'flex flex-col gap-2',
        month_caption: 'flex h-11 items-center justify-center sm:h-9',
        caption_label: 'text-sm font-semibold',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous:
          'inline-flex size-11 items-center justify-center rounded-lg hover:bg-accent sm:size-9 disabled:opacity-50',
        button_next:
          'inline-flex size-11 items-center justify-center rounded-lg hover:bg-accent sm:size-9 disabled:opacity-50',
        month_grid: 'border-collapse',
        weekdays: 'flex',
        weekday: cn(
          'text-muted-foreground text-xs font-normal',
          DAY_SIZE,
          'grid place-items-center',
        ),
        week: 'flex',
        day: cn('p-0 text-center text-sm', DAY_SIZE),
        day_button: cn(
          'inline-flex items-center justify-center rounded-lg text-sm tabular-nums hover:bg-accent',
          'disabled:text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent',
          DAY_SIZE,
        ),
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
        today: '[&>button]:font-bold [&>button]:underline [&>button]:underline-offset-4',
        outside: 'text-muted-foreground opacity-60',
        disabled: 'text-muted-foreground opacity-40',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}

export { Calendar };
