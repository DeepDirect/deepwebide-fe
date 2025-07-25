import { rootRoute } from './root';
import { landingRoute } from './routes/landing/landing';
import { authLayoutRoute } from './routes/auth/auth-layout';
import { signInRoute } from './routes/auth/sign-in';
import { findIdLayoutRoute, findIdFormRoute } from './routes/auth/find-id';
import { findIdCompleteRoute } from './routes/auth/find-id/complete';
import { findPasswordLayoutRoute, findPasswordFormRoute } from './routes/auth/find-password';
import { changePasswordRoute } from './routes/auth/find-password/change';
import { mainLayoutRoute, mainIndexRoute } from './routes/main/main-layout';
import { PrivateRepoPageRoute } from './routes/main/private-repo';
import { SharedByMeRepoRoute } from './routes/main/shared-by-me-repo';
import { SharedWithMeRepoRoute } from './routes/main/shared-with-me-repo';
import { repoLayoutRoute, repoPageRoute } from './routes/$repoId';
import { signUpLayoutRoute, signUpFormRoute } from './routes/auth/sign-up';
import { signUpCompleteRoute } from './routes/auth/sign-up/complete';
import {
  settingsLayoutRoute,
  settingsIndexRoute,
  privateSettingsRoute,
  sharedByMeSettingsRoute,
  sharedWithMeSettingsRoute,
} from './routes/settings/settings';

export const routeTree = rootRoute.addChildren([
  landingRoute,
  authLayoutRoute.addChildren([
    signInRoute,
    signUpLayoutRoute.addChildren([signUpFormRoute, signUpCompleteRoute]),
    findIdLayoutRoute.addChildren([findIdFormRoute, findIdCompleteRoute]),
    findPasswordLayoutRoute.addChildren([findPasswordFormRoute, changePasswordRoute]),
  ]),
  mainLayoutRoute.addChildren([
    mainIndexRoute,
    PrivateRepoPageRoute,
    SharedByMeRepoRoute,
    SharedWithMeRepoRoute,
  ]),
  repoLayoutRoute.addChildren([repoPageRoute]),
  settingsLayoutRoute.addChildren([
    settingsIndexRoute,
    privateSettingsRoute,
    sharedByMeSettingsRoute,
    sharedWithMeSettingsRoute,
  ]),
]);
