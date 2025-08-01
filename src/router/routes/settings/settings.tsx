import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/router/root';
import SettingsPage from '@/pages/SettingsPage/SettingsPage';

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$repoId/settings',
  component: SettingsPage,
});
