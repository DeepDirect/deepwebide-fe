import { createRoute } from '@tanstack/react-router';
import { authLayoutRoute } from '../auth-layout';
import FindPasswordPage from '@/pages/Auth/FindPasswordPage/FindPasswordPage';
import { changePasswordRoute } from './change';

export const findPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'find-password',
  component: FindPasswordPage,
});

findPasswordRoute.addChildren([changePasswordRoute]);
