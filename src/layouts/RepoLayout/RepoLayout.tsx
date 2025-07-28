import { Outlet } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import styles from './RepoLayout.module.scss';
import clsx from 'clsx';

import RepoHeader from '@/components/organisms/Header/RepoHeader/RepoHeader';
import { Sidebar } from '@/components/organisms/Sidebar/RepoSidebar/RepoSidebar';
import { useThemeStore } from '@/stores/themeStore';
import { useFileSectionStore } from '@/stores/fileSectionStore';
import { useMockRepoInitializer } from '@/hooks/useMockRepoInitializer';
import Chat from '@/features/Chat/Chat';

export function RepoLayout() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  useMockRepoInitializer();
  const { isDarkMode } = useThemeStore();
  const { isVisible: isFileSectionVisible } = useFileSectionStore();

  const handleChatToggle = () => {
    setIsChatOpen(prev => !prev);
  };

  // 레포 페이지에서만 다크모드를 DOM에 적용
  useEffect(() => {
    const htmlElement = document.documentElement;

    if (isDarkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    // 컴포넌트 언마운트 시 다크모드 클래스 제거 (레포 페이지를 벗어날 때)
    return () => {
      htmlElement.classList.remove('dark');
    };
  }, [isDarkMode]);

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
          <Chat />
        </div>
      )}
    </div>
  );
}
