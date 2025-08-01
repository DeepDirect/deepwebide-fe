import { redirect } from '@tanstack/react-router';
import { entrycodeApi } from '@/api/entrycode.api';
import type { AuthState } from '@/types/auth/authState.types';
import { useToastStore } from '@/stores/toastStore';

/**
 * 레포지토리 접근 권한 체크 로직
 */
export const checkRepositoryAccess = async (repoId: string, auth: AuthState) => {
  // 1. 로그인 체크
  if (!auth.isLoggedIn) {
    useToastStore.getState().showToast({
      message: '로그인이 필요한 기능입니다.',
      type: 'warning',
      duration: 5000,
    });
    throw redirect({ to: '/sign-in' });
  }

  // 2. 레포지토리 접근 권한 체크
  let response;
  try {
    response = await entrycodeApi.getRepositoryAccessibility(repoId);
  } catch {
    useToastStore.getState().showToast({
      message: '접근할 수 없는 레포지토리입니다.',
      type: 'error',
      duration: 5000,
    });
    throw redirect({ to: '/main' });
  }

  // API 호출 성공 후 접근 권한 체크
  if (response.data.data.access === true) {
    // 2-1. access: true
    // 2-1-a. 내 개인 레포지토리 (isShared: false)
    // 2-1-b. 내가 참여한 공유 레포지토리 (isShared: true)
    // 성공적인 접근 시에는 토스트를 표시하지 않음 (UX 향상)
  } else {
    // 2-2. access: false
    // 2-2-a. 타인의 개인 레포지토리인 경우 (isShared: false)
    const isShared = response.data.data.repository.isShared;
    if (!isShared) {
      useToastStore.getState().showToast({
        message: '해당 레포지토리는 공유 레포지토리가 아닙니다.',
        type: 'warning',
        duration: 5000,
      });
      throw redirect({
        to: '/main',
      });
    }
    // 2-2-b. 내가 멤버가 아닌 공유 레포지토리인 경우, 입장 코드 입력페이지로 리다이렉트
    const repositoryName = response.data.data.repository.repositoryName;
    throw redirect({
      to: `/${repoId}/share`,
      search: { repositoryName },
    });
  }
};
