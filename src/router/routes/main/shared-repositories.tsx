import { createRoute } from '@tanstack/react-router';
import { mainLayoutRoute } from '@/router/routes/main/main-layout';

import SharedRepositoriesPage from '@/pages/Main/SharedRepositoryPage/SharedRepositoriesPage';

export const SharedRepositoriesRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: '/main/shared-repo',
  component: SharedRepositoriesPage,
});
