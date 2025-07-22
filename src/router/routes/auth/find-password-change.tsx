import { createRoute } from '@tanstack/react-router';
import { authLayoutRoute } from './auth-layout';
import ChangePasswordPage from '@/pages/FindPasswordPage/ChangePasswordPage';

export const changePasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/find-password/change',
  component: ChangePasswordPage,
});
