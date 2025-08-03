import { Outlet, useParams } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import styles from './RepoLayout.module.scss';
import clsx from 'clsx';

import RepoHeader from '@/components/organisms/Header/RepoHeader/RepoHeader';
import { Sidebar } from '@/components/organisms/Sidebar/RepoSidebar/RepoSidebar';
import { useThemeStore } from '@/stores/themeStore';
import { useFileSectionStore } from '@/stores/fileSectionStore';
import { useAuthStore } from '@/stores/authStore';
import { getCurrentUserId, getCurrentNickname } from '@/utils/authChatUtils';
import Chat from '@/features/Chat/Chat';
import useStompChat from '@/hooks/chat/useStompChat';

export function RepoLayout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNewChatMessage, setIsNewChatMessage] = useState(false);
  const lastReadMessageCountRef = useRef(0);
  const { repoId } = useParams({ strict: false });

  const { isDarkMode, enableRepoTheme, disableRepoTheme } = useThemeStore();
  const { isVisible: isFileSectionVisible } = useFileSectionStore();
  const { isLoggedIn } = useAuthStore();

  // 로그인된 사용자 정보 가져오기
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentNickname();

  // 디버깅: 사용자 정보 변경 확인
  console.log('🔍 현재 사용자 정보', {
    repoId,
    currentUserId,
    currentUserName,
    isLoggedIn,
    enabled: !!repoId && isLoggedIn,
  });

  const { isConnected, connectedCount, messages, send } = useStompChat(
    'https://api.deepdirect.site/ws/chat',
    repoId
  );

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

  // 채팅이 닫혀있을 때 새 메시지가 추가되면 알림 표시
  useEffect(() => {
    if (isChatOpen) {
      setIsNewChatMessage(false);
      lastReadMessageCountRef.current = messages.length;
    } else if (!isChatOpen && messages.length > lastReadMessageCountRef.current) {
      setIsNewChatMessage(true);
    }
  }, [messages.length, isChatOpen]);

  return (
    <div
      className={clsx(styles.RepoLayout, {
        [styles.RepoLayoutDark]: isDarkMode,
        [styles.RepoLayoutWithChat]: isChatOpen && isFileSectionVisible,
        [styles.RepoLayoutWithChatNoFileSection]: isChatOpen && !isFileSectionVisible,
      })}
    >
      <RepoHeader
        onChatButtonClick={handleChatToggle}
        isChatOpen={isChatOpen}
        isNewChatMessage={isNewChatMessage}
      />
      <Sidebar />

      <main className="content-area">
        <Outlet />
      </main>

      {isChatOpen && (
        <div className={styles.chatContainer}>
          <Chat
            isConnected={isConnected}
            connectedCount={connectedCount}
            messages={messages}
            send={send}
          />
        </div>
      )}
    </div>
  );
}
