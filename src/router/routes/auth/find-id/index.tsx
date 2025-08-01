import { createRoute, Outlet } from '@tanstack/react-router';
import { authLayoutRoute } from '../auth-layout';
import FindIdPage from '@/pages/Auth/FindIdPage/FindIdPage';

export const findIdLayoutRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'find-id',
  component: () => <Outlet />,
});

export const findIdFormRoute = createRoute({
  getParentRoute: () => findIdLayoutRoute,
  path: '/',
  component: FindIdPage,
});
