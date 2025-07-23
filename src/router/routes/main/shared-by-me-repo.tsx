import { createRoute } from '@tanstack/react-router';
import { mainLayoutRoute } from '@/router/routes/main/main-layout';

import SharedByMeRepoPage from '@/pages/Main/SharedByMeRepoPage/SharedByMeRepoPage';

export const SharedByMeRepoRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: '/main/shared-by-me-repo',
  component: SharedByMeRepoPage,
});
