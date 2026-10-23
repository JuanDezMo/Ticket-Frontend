interface HeldSeat {
  eventId: string;
}

/**
 * Cuántos seats más puede elegir el usuario en un evento: el límite del evento menos sus
 * reservas en curso de ese evento (las de otros eventos no cuentan). Es una ayuda: la UI no
 * conoce lo ya comprado, así que la API siempre tiene la última palabra.
 */
export function seatAllowance(
  maxSeatsPerUser: number,
  holds: readonly HeldSeat[],
  eventId: string,
): number {
  const heldHere = holds.filter((hold) => hold.eventId === eventId).length;
  return Math.max(0, maxSeatsPerUser - heldHere);
}

/** Total de los seats en centavos, sin arrastrar errores de coma flotante. */
export function totalPrice(price: number, seatCount: number): number {
  return (Math.round(price * 100) * seatCount) / 100;
}

/** "A3", "A3 and A4", "A3, A4 and A5". */
export function joinLabels(labels: readonly string[]): string {
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}
