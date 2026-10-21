import { env } from '@/shared/config/env';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: env.currency,
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
  return formatter.format(amount);
}
