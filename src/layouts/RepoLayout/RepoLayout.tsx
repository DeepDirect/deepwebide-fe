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
  const { isDarkMode, enableRepoTheme, disableRepoTheme } = useThemeStore();
  const { isVisible: isFileSectionVisible } = useFileSectionStore();

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
          <Chat />
        </div>
      )}
    </div>
  );
}
