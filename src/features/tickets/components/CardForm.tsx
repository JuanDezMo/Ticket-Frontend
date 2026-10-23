import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '@/shared/api/error-messages';
import { setFormApiError } from '@/shared/api/form-errors';
import { formatMoney } from '@/shared/lib/format-money';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { FormServerError } from '@/shared/ui/form-server-error';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
import { cardSchema, toCardPayload, type CardValues } from '../card.schemas';
import { formatCardNumber, formatExpiry, onlyDigits } from '../format-card';
import {
  PURCHASE_ACTIONS,
  PURCHASE_FIELD_BY_CODE,
  getPurchaseAction,
  type PurchaseAction,
} from '../purchase-errors';
import { CARD_BRAND_VALUES, type CardPayload, type IssuedTicket } from '../types';

interface CardFormProps {
  amount: number;
  isPaying: boolean;
  // La cuenta regresiva llegó a cero: no se puede pagar
  locked: boolean;
  pay: (card: CardPayload) => Promise<IssuedTicket | undefined>;
  onPaid: (ticket: IssuedTicket) => void;
  // La reserva ya no se puede pagar: la página reemplaza el formulario por su vista
  onEnded: (action: PurchaseAction) => void;
}

const CVV_DIGITS = 3;

export function CardForm({ amount, isPaying, locked, pay, onPaid, onEnded }: CardFormProps) {
  const form = useForm<CardValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { number: '', expiry: '', cvv: '' },
  });
  const { errors } = form.formState;
  // Pide devolver el foco al número; se cumple cuando el formulario ya no está deshabilitado
  const [focusRequests, setFocusRequests] = useState(0);
  const focusHandled = useRef(0);

  // Los datos de la tarjeta no sobreviven a la pantalla
  useEffect(() => () => form.reset(), [form]);

  // Los campos siguen deshabilitados hasta que termina el pago; el foco se pone después
  useEffect(() => {
    if (!isPaying && focusRequests > focusHandled.current) {
      focusHandled.current = focusRequests;
      form.setFocus('number');
    }
  }, [isPaying, focusRequests, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const ticket = await pay(toCardPayload(values));
      if (ticket) onPaid(ticket);
    } catch (error) {
      const action = getPurchaseAction(error);
      if (action === PURCHASE_ACTIONS.FIELD_ERROR) {
        setFormApiError(error, form.setError, PURCHASE_FIELD_BY_CODE);
      } else if (action === PURCHASE_ACTIONS.KEEP_FORM || action === PURCHASE_ACTIONS.CLEAR_CARD) {
        form.setError('root.server', { message: getErrorMessage(error) });
        if (action === PURCHASE_ACTIONS.CLEAR_CARD) {
          form.resetField('number');
          form.resetField('cvv');
          setFocusRequests((count) => count + 1);
        }
      } else {
        onEnded(action);
      }
    }
  });

  const number = form.register('number');
  const expiry = form.register('expiry');
  const cvv = form.register('cvv');

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={isPaying} className="m-0 min-w-0 border-0 p-0">
        <FieldGroup>
          <Field data-invalid={!!errors.brand}>
            <FieldLabel htmlFor="card-brand">Card brand</FieldLabel>
            <NativeSelect
              id="card-brand"
              className="w-full"
              aria-invalid={!!errors.brand}
              autoComplete="cc-type"
              defaultValue=""
              {...form.register('brand')}
            >
              <NativeSelectOption value="">Choose</NativeSelectOption>
              {CARD_BRAND_VALUES.map((brand) => (
                <NativeSelectOption key={brand} value={brand}>
                  {brand}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={[errors.brand]} />
          </Field>
          <Field data-invalid={!!errors.number}>
            <FieldLabel htmlFor="card-number">Card number</FieldLabel>
            <Input
              id="card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              aria-invalid={!!errors.number}
              {...number}
              onChange={(event) => {
                event.target.value = formatCardNumber(event.target.value);
                return number.onChange(event);
              }}
            />
            <FieldError errors={[errors.number]} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={!!errors.expiry}>
              <FieldLabel htmlFor="card-expiry">Expiry (MM/YY)</FieldLabel>
              <Input
                id="card-expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                aria-invalid={!!errors.expiry}
                {...expiry}
                onChange={(event) => {
                  event.target.value = formatExpiry(event.target.value);
                  return expiry.onChange(event);
                }}
              />
              <FieldError errors={[errors.expiry]} />
            </Field>
            <Field data-invalid={!!errors.cvv}>
              <FieldLabel htmlFor="card-cvv">CVV</FieldLabel>
              <Input
                id="card-cvv"
                inputMode="numeric"
                autoComplete="cc-csc"
                aria-invalid={!!errors.cvv}
                {...cvv}
                onChange={(event) => {
                  event.target.value = onlyDigits(event.target.value).slice(0, CVV_DIGITS);
                  return cvv.onChange(event);
                }}
              />
              <FieldError errors={[errors.cvv]} />
            </Field>
          </div>
          <FormServerError message={errors.root?.server?.message} />
          <Button type="submit" disabled={locked}>
            {isPaying ? 'Paying...' : `Pay ${formatMoney(amount)}`}
          </Button>
        </FieldGroup>
      </fieldset>
    </form>
  );
}
