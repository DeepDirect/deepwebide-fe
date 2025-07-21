import { rootRoute } from './root';
import { authLayoutRoute } from './routes/auth/auth-layout';
import { signInRoute } from './routes/auth/sign-in';
import { signUpRoute } from './routes/auth/sign-up';
import { findIdRoute } from './routes/auth/find-id';
import { mainLayoutRoute } from './routes/main/main-layout';
import { myRepositoriesRoute } from './routes/main/my-repositories';

export const routeTree = rootRoute.addChildren([
  authLayoutRoute.addChildren([signInRoute, signUpRoute, findIdRoute]),
  mainLayoutRoute.addChildren([myRepositoriesRoute]),
]);
