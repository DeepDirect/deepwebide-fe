import { createRoute } from '@tanstack/react-router';
import { findPasswordRoute } from './index';
import ChangePasswordPage from '@/pages/Auth/ChangePasswordPage/ChangePasswordPage';

export const changePasswordRoute = createRoute({
  getParentRoute: () => findPasswordRoute,
  path: 'change',
  component: ChangePasswordPage,
});
