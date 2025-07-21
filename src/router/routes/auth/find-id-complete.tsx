import { createRoute } from '@tanstack/react-router';
import { authLayoutRoute } from './auth-layout';
import FindIdCompletePage from '@/pages/FindIdPage/FindIdCompletePage';

export const findIdCompleteRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'find-id/complete',
  component: FindIdCompletePage,
  validateSearch: search => ({
    email: String(search.email ?? ''),
  }),
});
