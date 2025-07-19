import { rootRoute } from './root';
import { authLayoutRoute } from './routes/auth/auth-layout';
import { signInRoute } from './routes/auth/sign-in';
import { signUpRoute } from './routes/auth/sign-up';

export const routeTree = rootRoute.addChildren([
  authLayoutRoute.addChildren([signInRoute, signUpRoute]),
]);
