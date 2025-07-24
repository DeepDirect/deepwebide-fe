import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/router/root';
import { RepoLayout } from '@/layouts/RepoLayout/RepoLayout';
import { RepoPage } from '@/pages/Repo/RepoPage';

export const repoLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$repoId',
  component: RepoLayout,
});

export const repoPageRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/',
  component: RepoPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      file: (search.file as string) || undefined,
    };
  },
});
