import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '@/router/root';
import MainLayout from '@/layouts/MainLayout/MainLayout';
import type { AuthState } from '@/types/authState.types';

export const mainLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'main',
  component: MainLayout,
  beforeLoad: ({ context, location }) => {
    const { auth } = context as { auth: AuthState };

    if (!auth.isLoggedIn) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      });
    }
  },
});

export const mainIndexRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/main/private-repo' });
  },
});
