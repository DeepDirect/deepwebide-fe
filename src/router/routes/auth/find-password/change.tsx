import { createRoute } from '@tanstack/react-router';
import { findPasswordLayoutRoute } from './index';
import ChangePasswordPage from '@/pages/Auth/ChangePasswordPage/ChangePasswordPage';

export const changePasswordRoute = createRoute({
  getParentRoute: () => findPasswordLayoutRoute,
  path: 'change',
  component: ChangePasswordPage,
});
