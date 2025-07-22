import { rootRoute } from './root';
import { landingRoute } from './routes/landing/landing';
import { authLayoutRoute } from './routes/auth/auth-layout';
import { signInRoute } from './routes/auth/sign-in';
import { signUpRoute } from './routes/auth/sign-up';
import { signUpCompleteRoute } from './routes/auth/sign-up-complete';
import { findIdRoute } from './routes/auth/find-id';
import { findIdCompleteRoute } from './routes/auth/find-id-complete';
import { mainLayoutRoute } from './routes/main/main-layout';
import { myRepositoriesRoute } from './routes/main/my-repositories';
import { SharedRepositoriesRoute } from './routes/main/shared-repositories';
import { SharedMeRepositoriesRoute } from './routes/main/shared-me-repositories';

export const routeTree = rootRoute.addChildren([
  landingRoute,
  authLayoutRoute.addChildren([
    signInRoute,
    signUpRoute,
    signUpCompleteRoute,
    findIdRoute,
    findIdCompleteRoute,
  ]),
  mainLayoutRoute.addChildren([
    myRepositoriesRoute,
    SharedRepositoriesRoute,
    SharedMeRepositoriesRoute,
  ]),
]);
