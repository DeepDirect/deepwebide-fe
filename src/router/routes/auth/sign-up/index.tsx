import { createRoute } from '@tanstack/react-router';
import { authLayoutRoute } from '../auth-layout';
import SignUpPage from '@/pages/Auth/SignUpPage/SignUpPage';
import { signUpCompleteRoute } from './complete';

export const signUpRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'sign-up',
  component: SignUpPage,
});

signUpRoute.addChildren([signUpCompleteRoute]);
