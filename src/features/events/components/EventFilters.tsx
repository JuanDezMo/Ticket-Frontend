import { SlidersHorizontalIcon } from 'lucide-react';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from '../constants';
import { hasFilters, isDateRangeValid } from '../filters';
import {
  EVENT_STATUS_VALUES,
  EVENT_TYPE_VALUES,
  type EventFilters as Filters,
  type EventStatus,
  type EventType,
} from '../types';
import { SearchField } from './SearchField';

export const INVALID_RANGE_MESSAGE = "'From' must be before 'To'";

// Desde este ancho los filtros caben en línea; por debajo van en el panel
export const WIDE_FILTERS_QUERY = '(min-width: 640px)';

interface EventFiltersProps {
  filters: Filters;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onSearch: (value: string) => void;
  onClear: () => void;
}

// La búsqueda se cuenta aparte: siempre está a la vista
function countPanelFilters({ status, type, from, to }: Filters): number {
  return [status, type, from, to].filter(Boolean).length;
}

export function EventFilters({ filters, onChange, onSearch, onClear }: EventFiltersProps) {
  const wide = useMediaQuery(WIDE_FILTERS_QUERY);
  const rangeValid = isDateRangeValid(filters);
  const search = (
    <div className="flex flex-1 flex-col gap-1.5">
      <Label htmlFor="filter-search" className={wide ? undefined : 'sr-only'}>
        Search
      </Label>
      <SearchField id="filter-search" value={filters.search ?? ''} onSearch={onSearch} />
    </div>
  );
  const rangeError = !rangeValid && (
    <p role="alert" className="text-destructive text-sm font-semibold">
      {INVALID_RANGE_MESSAGE}
    </p>
  );

  if (wide) {
    return (
      <section aria-label="Filters" className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          {search}
          <FilterFields filters={filters} rangeValid={rangeValid} onChange={onChange} />
          <Button variant="outline" onClick={onClear} disabled={!hasFilters(filters)}>
            Clear filters
          </Button>
        </div>
        {rangeError}
      </section>
    );
  }

  const count = countPanelFilters(filters);
  return (
    <section aria-label="Filters" className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        {search}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontalIcon aria-hidden="true" />
              {count > 0 ? `Filters (${count})` : 'Filters'}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-lg px-4 pb-6">
            <SheetHeader className="px-0">
              <SheetTitle className="display text-code-md">Filters</SheetTitle>
            </SheetHeader>
            <div className="grid gap-3">
              <FilterFields filters={filters} rangeValid={rangeValid} onChange={onChange} />
              <Button variant="outline" onClick={onClear} disabled={!hasFilters(filters)}>
                Clear filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {rangeError}
    </section>
  );
}

interface FilterFieldsProps {
  filters: Filters;
  rangeValid: boolean;
  onChange: EventFiltersProps['onChange'];
}

function FilterFields({ filters, rangeValid, onChange }: FilterFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-status">Status</Label>
        <NativeSelect
          id="filter-status"
          className="w-full"
          value={filters.status ?? ''}
          onChange={(e) => onChange('status', (e.target.value || undefined) as EventStatus)}
        >
          <NativeSelectOption value="">All statuses</NativeSelectOption>
          {EVENT_STATUS_VALUES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {EVENT_STATUS_LABELS[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-type">Type</Label>
        <NativeSelect
          id="filter-type"
          className="w-full"
          value={filters.type ?? ''}
          onChange={(e) => onChange('type', (e.target.value || undefined) as EventType)}
        >
          <NativeSelectOption value="">All types</NativeSelectOption>
          {EVENT_TYPE_VALUES.map((type) => (
            <NativeSelectOption key={type} value={type}>
              {EVENT_TYPE_LABELS[type]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-from">From</Label>
        <Input
          id="filter-from"
          type="date"
          value={filters.from ?? ''}
          aria-invalid={!rangeValid}
          onChange={(e) => onChange('from', e.target.value || undefined)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-to">To</Label>
        <Input
          id="filter-to"
          type="date"
          value={filters.to ?? ''}
          aria-invalid={!rangeValid}
          onChange={(e) => onChange('to', e.target.value || undefined)}
        />
      </div>
    </>
  );
}
