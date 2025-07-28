import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '@/router/root';
import InvitationLinkPage from '@/pages/Auth/InvitationLinkPage/InvitationLinkPage';
import type { AuthState } from '@/types/authState.types';

export const invitationLinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$repoId/share',
  component: InvitationLinkPage,

  beforeLoad: ({ context }) => {
    const { auth } = context as { auth: AuthState };
    if (!auth.isLoggedIn) {
      // TODO - 토스트로 대체해야 함
      alert('로그인이 필요한 기능입니다.');
      throw redirect({ to: '/sign-in' });
    }
  },

  validateSearch: (search: Record<string, unknown>) => {
    return {
      repositoryName: (search.repositoryName as string) || undefined,
    };
  },
});
