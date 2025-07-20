import { createRoute } from '@tanstack/react-router';
import { mainLayoutRoute } from '@/router/routes/main/main-layout';

import MyRepositoriesPage from '@/pages/Main/MyRepositoriesPage/MyRepositoriesPage';

export const myRepositoriesRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  id: 'my-repositories',
  component: MyRepositoriesPage,
});
