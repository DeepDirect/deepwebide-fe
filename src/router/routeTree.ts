import { rootRoute } from './root';
import { landingRoute } from './routes/landing/landing';
import { authLayoutRoute } from './routes/auth/auth-layout';
import { signInRoute } from './routes/auth/sign-in';
import { signUpRoute } from './routes/auth/sign-up';
import { findIdRoute } from './routes/auth/find-id';
import { findPasswordRoute } from './routes/auth/find-password';
import { mainLayoutRoute } from './routes/main/main-layout';
import { PrivateRepoPageRoute } from './routes/main/private-repo';
import { SharedByMeRepoRoute } from './routes/main/shared-by-me-repo';
import { SharedWithMeRepoRoute } from './routes/main/shared-with-me-repo';

export const routeTree = rootRoute.addChildren([
  landingRoute,
  authLayoutRoute.addChildren([signInRoute, signUpRoute, findIdRoute, findPasswordRoute]),
  mainLayoutRoute.addChildren([PrivateRepoPageRoute, SharedByMeRepoRoute, SharedWithMeRepoRoute]),
]);
