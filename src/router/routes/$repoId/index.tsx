import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/router/root';
import { RepoLayout } from '@/layouts/RepoLayout/RepoLayout';
import { RepoPage } from '@/pages/Repo/RepoPage';
import { checkRepositoryAccess } from '@/utils/repositoryAccessGuard';
import type { AuthState } from '@/types/authState.types';

export const repoLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$repoId',
  component: RepoLayout,
});

export const repoPageRoute = createRoute({
  getParentRoute: () => repoLayoutRoute,
  path: '/',
  component: RepoPage,

  beforeLoad: async ({ params, context }) => {
    const { auth } = context as { auth: AuthState };
    const { repoId } = params;

    await checkRepositoryAccess(repoId, auth);
  },

  validateSearch: (search: Record<string, unknown>) => {
    return {
      file: (search.file as string) || undefined,
    };
  },
});
