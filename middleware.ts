export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/users/:path*', '/practice/:path*', '/late/:path*', '/notes/:path*', '/reports/:path*', '/audit/:path*', '/settings/:path*']
};
