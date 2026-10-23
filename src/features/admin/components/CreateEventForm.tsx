import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { SeatPreview } from '@/features/seats';
import { EVENT_TYPE_LABELS, EVENT_TYPE_VALUES, type Event } from '@/features/events';
import { setFormApiError } from '@/shared/api/form-errors';
import { Button } from '@/shared/ui/button';
import { DateTimeField } from '@/shared/ui/date-time-field';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { FormServerError } from '@/shared/ui/form-server-error';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
import { Textarea } from '@/shared/ui/textarea';
import { useCreateEvent } from '../hooks';
import { eventFormSchema, toCreateEventRequest, type EventFormValues } from '../schemas';

interface CreateEventFormProps {
  onCreated: (event: Event) => void;
}

const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Capacidad escrita como número, o NaN si todavía no es un número entero. */
function parseCapacity(text: string | undefined): number {
  return text && /^\d+$/.test(text.trim()) ? Number(text) : Number.NaN;
}

export function CreateEventForm({ onCreated }: CreateEventFormProps) {
  const { create, isPending } = useCreateEvent();
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: '',
      description: '',
      venue: '',
      price: '',
      capacity: '',
      maxSeatsPerUser: '',
    },
  });
  const { errors } = form.formState;
  const capacity = parseCapacity(useWatch({ control: form.control, name: 'capacity' }));

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const event = await create(toCreateEventRequest(values));
      if (event) onCreated(event);
    } catch (error) {
      setFormApiError(error, form.setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-2xl">
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="event-name">Name</FieldLabel>
          <Input id="event-name" aria-invalid={!!errors.name} {...form.register('name')} />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="event-description">Description</FieldLabel>
          <Textarea
            id="event-description"
            aria-invalid={!!errors.description}
            {...form.register('description')}
          />
          <FieldError errors={[errors.description]} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.type}>
            <FieldLabel htmlFor="event-type">Type</FieldLabel>
            <NativeSelect
              id="event-type"
              className="w-full"
              defaultValue=""
              aria-invalid={!!errors.type}
              {...form.register('type')}
            >
              <NativeSelectOption value="">Choose</NativeSelectOption>
              {EVENT_TYPE_VALUES.map((type) => (
                <NativeSelectOption key={type} value={type}>
                  {EVENT_TYPE_LABELS[type]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={[errors.type]} />
          </Field>
          <Field data-invalid={!!errors.venue}>
            <FieldLabel htmlFor="event-venue">Venue</FieldLabel>
            <Input id="event-venue" aria-invalid={!!errors.venue} {...form.register('venue')} />
            <FieldError errors={[errors.venue]} />
          </Field>
          <Field data-invalid={!!errors.price}>
            <FieldLabel htmlFor="event-price">Price (USD)</FieldLabel>
            <Input
              id="event-price"
              inputMode="decimal"
              aria-invalid={!!errors.price}
              {...form.register('price')}
            />
            <FieldError errors={[errors.price]} />
          </Field>
          <Field data-invalid={!!errors.capacity}>
            <FieldLabel htmlFor="event-capacity">Capacity</FieldLabel>
            <Input
              id="event-capacity"
              inputMode="numeric"
              aria-invalid={!!errors.capacity}
              {...form.register('capacity')}
            />
            <FieldDescription>
              Seats are generated from this and cannot change later.
            </FieldDescription>
            <FieldError errors={[errors.capacity]} />
          </Field>
          <Field data-invalid={!!errors.maxSeatsPerUser}>
            <FieldLabel htmlFor="event-max-seats">Max seats per buyer</FieldLabel>
            <Input
              id="event-max-seats"
              inputMode="numeric"
              aria-invalid={!!errors.maxSeatsPerUser}
              {...form.register('maxSeatsPerUser')}
            />
            <FieldDescription>From 1 to 8. It cannot be changed later.</FieldDescription>
            <FieldError errors={[errors.maxSeatsPerUser]} />
          </Field>
        </div>
        <SeatPreview capacity={capacity} />
        <div className="grid gap-4 sm:grid-cols-2">
          {(['startDate', 'endDate'] as const).map((name) => (
            <Field key={name} data-invalid={!!errors[name]}>
              <FieldLabel htmlFor={`event-${name}`}>
                {name === 'startDate' ? 'Start' : 'End'}
              </FieldLabel>
              <Controller
                control={form.control}
                name={name}
                render={({ field }) => (
                  <DateTimeField
                    id={`event-${name}`}
                    label={name === 'startDate' ? 'Start' : 'End'}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors[name]}
                  />
                )}
              />
              <FieldError errors={[errors[name]]} />
            </Field>
          ))}
        </div>
        <FieldDescription>Times are in your time zone ({TIME_ZONE}).</FieldDescription>
        <FormServerError message={errors.root?.server?.message} />
        <Button type="submit" disabled={isPending} className="sm:self-start">
          {isPending ? 'Creating...' : 'Create event'}
        </Button>
      </FieldGroup>
    </form>
  );
}
