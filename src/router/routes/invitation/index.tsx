import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '@/router/root';
import InvitationLinkPage from '@/pages/Auth/InvitationLinkPage/InvitationLinkPage';
import type { AuthState } from '@/types/auth/authState.types';
import { useToastStore } from '@/stores/toastStore';

export const invitationLinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$repoId/share',
  component: InvitationLinkPage,

  beforeLoad: ({ context }) => {
    const { auth } = context as { auth: AuthState };
    if (!auth.isLoggedIn) {
      useToastStore.getState().showToast({
        message: '로그인이 필요한 기능입니다.',
        type: 'warning',
        duration: 5000,
      });
      throw redirect({ to: '/sign-in' });
    }
  },

  validateSearch: (search: Record<string, unknown>) => {
    return {
      repositoryName: (search.repositoryName as string) || undefined,
    };
  },
});
