import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/router/root';
import LandingPage from '@/pages/LandingPage/LandingPage';

export const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});
