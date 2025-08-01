import { createRoute, Outlet } from '@tanstack/react-router';
import { authLayoutRoute } from '../auth-layout';
import SignUpPage from '@/pages/Auth/SignUpPage/SignUpPage';

export const signUpLayoutRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: 'sign-up',
  component: () => <Outlet />,
});

export const signUpFormRoute = createRoute({
  getParentRoute: () => signUpLayoutRoute,
  path: '/',
  component: SignUpPage,
});
