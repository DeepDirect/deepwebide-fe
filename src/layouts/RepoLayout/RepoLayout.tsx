import { Outlet } from '@tanstack/react-router';
import { useState } from 'react';
import styles from './RepoLayout.module.scss';
import clsx from 'clsx';

import RepoHeader from '@/components/organisms/Header/RepoHeader/RepoHeader';
import { Sidebar } from '@/components/organisms/Sidebar/RepoSidebar/RepoSidebar';
import { useThemeStore } from '@/stores/themeStore';
import { useMockRepoInitializer } from '@/hooks/useMockRepoInitializer';
import Chat from '@/features/Chat/Chat';

export function RepoLayout() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  useMockRepoInitializer();
  const { isDarkMode } = useThemeStore();

  const handleChatToggle = () => {
    setIsChatOpen(prev => !prev);
  };

  return (
    <div
      className={clsx(styles.RepoLayout, {
        [styles.RepoLayoutDark]: isDarkMode,
        [styles.RepoLayoutWithChat]: isChatOpen,
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
