import { createRoute } from '@tanstack/react-router';
import { mainLayoutRoute } from '@/router/routes/main/main-layout';

import SharedWithMeRepoPage from '@/pages/Main/SharedWithMeRepoPage/SharedWithMeRepoPage';

export const SharedWithMeRepoRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: 'shared-with-me-repo',
  component: SharedWithMeRepoPage,
});
