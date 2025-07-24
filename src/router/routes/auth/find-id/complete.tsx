import { createRoute } from '@tanstack/react-router';
import { findIdLayoutRoute } from './index';
import FindIdCompletePage from '@/pages/Auth/FindIdCompletePage/FindIdCompletePage';

export const findIdCompleteRoute = createRoute({
  getParentRoute: () => findIdLayoutRoute,
  path: 'complete',
  component: FindIdCompletePage,
});
