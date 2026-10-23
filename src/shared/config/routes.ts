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
  checkout: (reservationId: string) => `/checkout/${reservationId}`,
} as const;

export const REDIRECT_PARAM = 'redirect';
