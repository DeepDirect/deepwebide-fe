import { createRoute } from '@tanstack/react-router';
import { authLayoutRoute } from '../auth-layout';
import FindIdPage from '@/pages/FindIdPage/FindIdPage';
import { findIdCompleteRoute } from './complete';

export const findIdRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'find-id',
  component: FindIdPage,
});

findIdRoute.addChildren([findIdCompleteRoute]);
