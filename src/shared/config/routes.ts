export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  myTickets: '/my-tickets',
  admin: '/admin',
  eventDetailPattern: '/events/:id',
  eventDetail: (id: string) => `/events/${id}`,
} as const;

export const REDIRECT_PARAM = 'redirect';
