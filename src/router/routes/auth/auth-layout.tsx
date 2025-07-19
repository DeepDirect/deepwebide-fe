import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../../root';
import AuthLayout from '@/layouts/AuthLayout/AuthLayout';

export const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth-layout',
  path: '/',
  component: AuthLayout,
});
