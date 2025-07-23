import { createRoute } from '@tanstack/react-router';
import { findIdRoute } from './index';
import FindIdCompletePage from '@/pages/FindIdPage/FindIdCompletePage';

export const findIdCompleteRoute = createRoute({
  getParentRoute: () => findIdRoute,
  path: 'complete',
  component: FindIdCompletePage,
  validateSearch: search => ({
    email: String(search.email ?? ''),
  }),
});
