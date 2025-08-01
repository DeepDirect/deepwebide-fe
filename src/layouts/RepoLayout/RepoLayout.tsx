import { Outlet, useParams } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import styles from './RepoLayout.module.scss';
import clsx from 'clsx';

import RepoHeader from '@/components/organisms/Header/RepoHeader/RepoHeader';
import { Sidebar } from '@/components/organisms/Sidebar/RepoSidebar/RepoSidebar';
import { useThemeStore } from '@/stores/themeStore';
import { useFileSectionStore } from '@/stores/fileSectionStore';
// import { useWebSocketChat } from '@/hooks/chat/useWebSocketChat';
import { useAuthStore } from '@/stores/authStore';
import {
  getCurrentUserId,
  getCurrentNickname,
  //   getCurrentUserProfileImage,
} from '@/utils/authChatUtils';
// import ChatWSVer from '@/features/Chat/ChatWSVer';
import ChatRoom from '@/features/Chat/ChatRoom';

export function RepoLayout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { repoId } = useParams({ strict: false });

  const { isDarkMode, enableRepoTheme, disableRepoTheme } = useThemeStore();
  const { isVisible: isFileSectionVisible } = useFileSectionStore();
  const { isLoggedIn } = useAuthStore();

  // 로그인된 사용자 정보 가져오기
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentNickname();
  //   const currentUserProfileImage = getCurrentUserProfileImage();

  // 디버깅: 사용자 정보 변경 확인
  console.log('🔍 현재 사용자 정보', {
    repoId,
    currentUserId,
    currentUserName,
    isLoggedIn,
    enabled: !!repoId && isLoggedIn,
  });

  // ws 연결을 RepoLayout 레벨에서 관리 (채팅창 열림 닫힘과 무관)
  //   const {
  //     messages: wsMessages,
  //     sendMessage,
  //     isConnected,
  //     isLoading,
  //     onlineUsers,
  //   } = useWebSocketChat({
  //     roomId: repoId || 'default-room',
  //     userId: currentUserId,
  //     userName: currentUserName,
  //     profileImageUrl: currentUserProfileImage,
  //     enabled: !!repoId && isLoggedIn, // 레포에 있고 로그인되어 있을 때만 연결
  //   });

  const handleChatToggle = () => {
    setIsChatOpen(prev => !prev);
  };

  // 레포 페이지에서만 테마 관리
  useEffect(() => {
    enableRepoTheme();

    return () => {
      disableRepoTheme();
    };
  }, [enableRepoTheme, disableRepoTheme]);

  return (
    <div
      className={clsx(styles.RepoLayout, {
        [styles.RepoLayoutDark]: isDarkMode,
        [styles.RepoLayoutWithChat]: isChatOpen && isFileSectionVisible,
        [styles.RepoLayoutWithChatNoFileSection]: isChatOpen && !isFileSectionVisible,
      })}
    >
      <RepoHeader onChatButtonClick={handleChatToggle} />
      <Sidebar />

      <main className="content-area">
        <Outlet />
      </main>

      {isChatOpen && (
        <div className={styles.chatContainer}>
          {/* <ChatWSVer
			  messages={wsMessages}
			  sendMessage={sendMessage}
			  isConnected={isConnected}
			  isLoading={isLoading}
			  onlineUsers={onlineUsers}
			/> */}
          <ChatRoom />
        </div>
      )}
    </div>
  );
}
