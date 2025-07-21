import { rootRoute } from './root';
import { authLayoutRoute } from './routes/auth/auth-layout';
import { signInRoute } from './routes/auth/sign-in';
import { signUpRoute } from './routes/auth/sign-up';
import { mainLayoutRoute } from './routes/main/main-layout';
import { myRepositoriesRoute } from './routes/main/my-repositories';

export const routeTree = rootRoute.addChildren([
  authLayoutRoute.addChildren([signInRoute, signUpRoute]),
  mainLayoutRoute.addChildren([myRepositoriesRoute]),
]);
