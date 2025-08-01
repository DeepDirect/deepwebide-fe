import { createRoute } from '@tanstack/react-router';
import { authLayoutRoute } from './auth-layout';
import SignInPage from '@/pages/Auth/SignInPage/SignInPage';

export const signInRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'sign-in',
  component: SignInPage,
});
