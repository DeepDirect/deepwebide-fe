import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/router/root';

import MainLayout from '@/layouts/MainLayout/MainLayout';

export const mainLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'main-layout',
  component: MainLayout,
});
