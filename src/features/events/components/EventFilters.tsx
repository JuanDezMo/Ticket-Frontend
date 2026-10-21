import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
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

interface EventFiltersProps {
  filters: Filters;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onSearch: (value: string) => void;
  onClear: () => void;
}

export function EventFilters({ filters, onChange, onSearch, onClear }: EventFiltersProps) {
  const rangeValid = isDateRangeValid(filters);

  return (
    <section aria-label="Filters" className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <Label htmlFor="filter-search">Search</Label>
          <SearchField id="filter-search" value={filters.search ?? ''} onSearch={onSearch} />
        </div>
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
        <div className="flex items-end">
          <Button variant="outline" onClick={onClear} disabled={!hasFilters(filters)}>
            Clear filters
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
      </div>
      {!rangeValid && (
        <p role="alert" className="text-destructive text-sm">
          {INVALID_RANGE_MESSAGE}
        </p>
      )}
    </section>
  );
}
