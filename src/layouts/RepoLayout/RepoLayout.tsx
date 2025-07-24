import { Outlet } from '@tanstack/react-router';
import styles from './RepoLayout.module.scss';
import clsx from 'clsx';

import Header from '@/components/organisms/Header/Header';
import { Sidebar } from '@/components/organisms/Sidebar/RepoSidebar/RepoSidebar';
import { useThemeStore } from '@/stores/themeStore';
import { useMockRepoInitializer } from '@/hooks/useMockRepoInitializer';

export function RepoLayout() {
  useMockRepoInitializer();
  const { isDarkMode } = useThemeStore();

  return (
    <div className={clsx(styles.RepoLayout, { [styles.RepoLayoutDark]: isDarkMode })}>
      <Header variant="repo" />
      <Sidebar />
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}
