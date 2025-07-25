import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '@/router/root';
import SettingsLayout from '@/layouts/SettingsLayout/SettingsLayout';
import PrivateSettingsPage from '@/pages/SettingsPage/PrivateSettingsPage/PrivateSettingsPage';
import SharedByMeSettingsPage from '@/pages/SettingsPage/SharedByMeSettingsPage/SharedByMeSettingsPage';
import SharedWithMeSettingsPage from '@/pages/SettingsPage/SharedWithMeSettingsPage/SharedWithMeSettingsPage';

export const settingsLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'settings',
  component: SettingsLayout,
});

export const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/settings/private-settings' });
  },
});

export const privateSettingsRoute = createRoute({
  getParentRoute: () => settingsLayoutRoute,
  path: 'private-settings',
  component: PrivateSettingsPage,
});

export const sharedByMeSettingsRoute = createRoute({
  getParentRoute: () => settingsLayoutRoute,
  path: 'shared-by-me-settings',
  component: SharedByMeSettingsPage,
});

export const sharedWithMeSettingsRoute = createRoute({
  getParentRoute: () => settingsLayoutRoute,
  path: 'shared-with-me-settings',
  component: SharedWithMeSettingsPage,
});
