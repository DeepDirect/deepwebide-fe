import { createRoute } from '@tanstack/react-router';
import { signUpRoute } from './index';
import SignUpCompletePage from '@/pages/SignUpPage/SignUpCompletePage';

export const signUpCompleteRoute = createRoute({
  getParentRoute: () => signUpRoute,
  path: 'complete',
  component: SignUpCompletePage,
});
