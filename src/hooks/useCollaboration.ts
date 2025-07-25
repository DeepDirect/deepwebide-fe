import { useEffect, useCallback } from 'react';
import { useCollaborationStore } from '@/stores/collaborationStore';

interface UseCollaborationProps {
  roomId: string;
  editor: unknown;
  userId: string;
  userName: string;
  enabled?: boolean;
}

interface UseCollaborationReturn {
  isConnected: boolean;
}

export const useCollaboration = ({
  roomId,
  editor,
  userId,
  userName,
  enabled = true,
}: UseCollaborationProps): UseCollaborationReturn => {
  const { setConnectionStatus, setCurrentUser, addUser } = useCollaborationStore();

  // 초기화 함수
  const initialize = useCallback(() => {
    if (!editor || !roomId || !enabled) return;

    console.log('협업 초기화:', roomId);

    // 현재 사용자 설정 (색상은 addUser에서 자동 할당됨)
    const currentUser = {
      id: userId,
      name: userName,
      color: '',
    };

    // 현재 사용자를 먼저 addUser로 추가하여 색상 자동 할당
    addUser(currentUser);

    // addUser로 추가된 사용자 정보를 currentUser로 설정
    setCurrentUser(currentUser);

    // 연결 상태 설정
    setConnectionStatus(true);

    // 테스트용 다른 사용자 추가 (색상 자동 할당)
    const mockUsers = [
      { id: 'user-2', name: '협업자 1', color: '' },
      { id: 'user-3', name: '협업자 2', color: '' },
    ];

    mockUsers.forEach((user, index) => {
      setTimeout(
        () => {
          addUser(user); // addUser가 자동으로 색상 할당
        },
        (index + 1) * 1000
      );
    });
  }, [roomId, editor, userId, userName, enabled, setConnectionStatus, setCurrentUser, addUser]);

  // 정리 함수
  const cleanup = useCallback(() => {
    console.log('협업 정리');
    setConnectionStatus(false);
  }, [setConnectionStatus]);

  useEffect(() => {
    if (enabled) {
      initialize();
    } else {
      cleanup();
    }

    return cleanup;
  }, [enabled, initialize, cleanup]);

  return {
    isConnected: enabled,
  };
};
