import { createRoute, Outlet } from '@tanstack/react-router';
import { authLayoutRoute } from '../auth-layout';
import FindPasswordPage from '@/pages/Auth/FindPasswordPage/FindPasswordPage';

export const findPasswordLayoutRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'find-password',
  component: () => <Outlet />,
});

export const findPasswordFormRoute = createRoute({
  getParentRoute: () => findPasswordLayoutRoute,
  path: '/',
  component: FindPasswordPage,
});
