export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  myTickets: '/my-tickets',
  admin: '/admin',
  adminNewEvent: '/admin/events/new',
  adminNewUser: '/admin/users/new',
  eventDetailPattern: '/events/:id',
  eventDetail: (id: string) => `/events/${id}`,
  checkoutPattern: '/checkout/:reservationId',
  // Pago de varias reservas del mismo evento: /checkout?ids=a,b,c
  checkoutGroup: '/checkout',
  checkout: (reservationId: string) => `/checkout/${reservationId}`,
  checkoutFor: (reservationIds: readonly string[]) =>
    reservationIds.length === 1
      ? `/checkout/${reservationIds[0]}`
      : `/checkout?ids=${reservationIds.join(',')}`,
} as const;

export const REDIRECT_PARAM = 'redirect';
