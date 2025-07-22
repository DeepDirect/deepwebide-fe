import { createRoute } from '@tanstack/react-router';
import { authLayoutRoute } from './auth-layout';
import SignUpCompletePage from '@/pages/SignUpPage/SignUpCompletePage';

export const signUpCompleteRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'sign-up-complete',
  component: SignUpCompletePage,
});
