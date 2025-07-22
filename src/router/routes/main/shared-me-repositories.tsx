import { createRoute } from '@tanstack/react-router';
import { mainLayoutRoute } from '@/router/routes/main/main-layout';

import SharedMeRepositoryPage from '@/pages/Main/SharedMeRepositoryPage/SharedMeRepositoryPage';

export const SharedMeRepositoriesRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: '/main/shared-me-repo',
  component: SharedMeRepositoryPage,
});
