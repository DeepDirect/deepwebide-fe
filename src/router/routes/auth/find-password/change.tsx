import { createRoute } from '@tanstack/react-router';
import { findPasswordRoute } from './index';
import ChangePasswordPage from '@/pages/FindPasswordPage/ChangePasswordPage';

export const changePasswordRoute = createRoute({
  getParentRoute: () => findPasswordRoute,
  path: 'change',
  component: ChangePasswordPage,
});
