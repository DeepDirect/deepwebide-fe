import { createRoute } from '@tanstack/react-router';
import { signUpLayoutRoute } from './index';
import SignUpCompletePage from '@/pages/Auth/SignUpCompletePage/SignUpCompletePage';

export const signUpCompleteRoute = createRoute({
  getParentRoute: () => signUpLayoutRoute,
  path: 'complete',
  component: SignUpCompletePage,
});
