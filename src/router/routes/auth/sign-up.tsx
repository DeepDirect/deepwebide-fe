import { createRoute } from '@tanstack/react-router';
import { authLayoutRoute } from './auth-layout';
import SignUpPage from '@/pages/SignUpPage/SignUpPage';

export const signUpRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'sign-up',
  component: SignUpPage,
});
