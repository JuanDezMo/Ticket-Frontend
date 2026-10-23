import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/shared/api/api-error';
import type { IssuedTicket } from '../types';
import { CardForm } from './CardForm';

const ticket: IssuedTicket = {
  id: 't1',
  reservationId: 'r1',
  eventId: 'e1',
  seat: 'C7',
  status: 'ISSUED',
  amount: 49.99,
  transactionId: 'txn_1',
  issuedAt: '2026-10-22T15:00:00Z',
};

function setup(pay = vi.fn().mockResolvedValue(ticket), props = {}) {
  const onPaid = vi.fn();
  const onEnded = vi.fn();
  const user = userEvent.setup();
  render(
    <CardForm
      amount={49.99}
      isPaying={false}
      locked={false}
      pay={pay}
      onPaid={onPaid}
      onEnded={onEnded}
      {...props}
    />,
  );
  return { pay, onPaid, onEnded, user };
}

async function fillCard(user: ReturnType<typeof userEvent.setup>, number = '4111 1111 1111 1111') {
  await user.selectOptions(screen.getByLabelText('Card brand'), 'VISA');
  await user.type(screen.getByLabelText('Card number'), number);
  await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1299');
  await user.type(screen.getByLabelText('CVV'), '123');
}

const payButton = () => screen.getByRole('button', { name: /^Pay / });

describe('CardForm', () => {
  it('has the browser autofill attributes and the amount on the button', () => {
    setup();
    expect(screen.getByLabelText('Card brand')).toHaveAttribute('autocomplete', 'cc-type');
    expect(screen.getByLabelText('Card number')).toHaveAttribute('autocomplete', 'cc-number');
    expect(screen.getByLabelText('Expiry (MM/YY)')).toHaveAttribute('autocomplete', 'cc-exp');
    expect(screen.getByLabelText('CVV')).toHaveAttribute('autocomplete', 'cc-csc');
    expect(payButton()).toHaveTextContent('Pay $49.99');
  });

  it('validates in the client and sends nothing', async () => {
    const { pay, user } = setup();
    await user.selectOptions(screen.getByLabelText('Card brand'), 'VISA');
    await user.type(screen.getByLabelText('Card number'), '4111111111');
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '0120');
    await user.type(screen.getByLabelText('CVV'), '12');

    await user.click(payButton());

    expect(await screen.findByText('Enter a card number of 13 to 19 digits')).toBeInTheDocument();
    expect(screen.getByText('This card has expired')).toBeInTheDocument();
    expect(screen.getByText('Enter the 3-digit code')).toBeInTheDocument();
    expect(pay).not.toHaveBeenCalled();
  });

  it('sends only the digits of the number', async () => {
    const { pay, onPaid, user } = setup();
    await fillCard(user);

    await user.click(payButton());

    await waitFor(() => expect(onPaid).toHaveBeenCalledWith(ticket));
    expect(pay).toHaveBeenCalledWith({
      brand: 'VISA',
      number: '4111111111111111',
      expiry: '12/99',
      cvv: '123',
    });
  });

  it('disables the fields and shows "Paying..." while paying', () => {
    setup(undefined, { isPaying: true });
    expect(screen.getByRole('button', { name: 'Paying...' })).toBeDisabled();
    expect(screen.getByLabelText('Card number')).toBeDisabled();
    expect(screen.getByLabelText('CVV')).toBeDisabled();
  });

  it('disables Pay when the time is up', () => {
    setup(undefined, { locked: true });
    expect(payButton()).toBeDisabled();
  });

  it.each([
    ['PAYMENT_REJECTED', 402],
    ['CARD_PROBLEM', 422],
  ])('clears the number and CVV after %s and focuses the number', async (code, status) => {
    const pay = vi.fn().mockRejectedValue(new ApiError(status, code, 'x'));
    const { user } = setup(pay);
    await fillCard(user);

    await user.click(payButton());

    await waitFor(() => expect(screen.getByLabelText('Card number')).toHaveValue(''));
    expect(screen.getByLabelText('CVV')).toHaveValue('');
    expect(screen.getByLabelText('Expiry (MM/YY)')).toHaveValue('12/99');
    expect(screen.getByLabelText('Card number')).toHaveFocus();
  });

  it.each([
    ['PAYMENT_GATEWAY_ERROR', 502, 'Payment service error. Please try again'],
    [
      'PAYMENT_GATEWAY_TIMEOUT',
      504,
      'Payment service timed out. Please try again. You will not be charged twice',
    ],
  ])('keeps the data after %s so the user can retry', async (code, status, message) => {
    const pay = vi.fn().mockRejectedValue(new ApiError(status, code, 'x'));
    const { user } = setup(pay);
    await fillCard(user);

    await user.click(payButton());

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText('Card number')).toHaveValue('4111 1111 1111 1111');
    expect(screen.getByLabelText('CVV')).toHaveValue('123');
    expect(payButton()).toBeEnabled();
  });

  it('shows a VALIDATION_ERROR next to the number', async () => {
    const pay = vi.fn().mockRejectedValue(new ApiError(400, 'VALIDATION_ERROR', 'x'));
    const { user } = setup(pay);
    await fillCard(user);

    await user.click(payButton());

    const number = screen.getByLabelText('Card number');
    expect(await screen.findByText(/Some fields are invalid/)).toBeInTheDocument();
    expect(number).toHaveAttribute('aria-invalid', 'true');
    expect(number).toHaveValue('4111 1111 1111 1111');
  });

  it('hands reservation problems to the page', async () => {
    const pay = vi.fn().mockRejectedValue(new ApiError(409, 'RESERVATION_EXPIRED', 'x'));
    const { user, onEnded } = setup(pay);
    await fillCard(user);

    await user.click(payButton());

    await waitFor(() => expect(onEnded).toHaveBeenCalledWith('SHOW_EXPIRED'));
  });
});
