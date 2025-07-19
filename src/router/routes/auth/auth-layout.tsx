import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/router/root';
import AuthLayout from '@/layouts/AuthLayout/AuthLayout';

export const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth-layout',
  component: AuthLayout,
});
