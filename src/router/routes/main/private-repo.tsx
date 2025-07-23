import { createRoute } from '@tanstack/react-router';
import { mainLayoutRoute } from '@/router/routes/main/main-layout';

import PrivateRepoPage from '@/pages/Main/PrivateRepoPage/PrivateRepoPage';

export const PrivateRepoPageRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: '/main/private-repo',
  component: PrivateRepoPage,
});
