import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '@/router/root';
import MainLayout from '@/layouts/MainLayout/MainLayout';

export const mainLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'main',
  component: MainLayout,
});

export const mainIndexRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/main/private-repo' });
  },
});
