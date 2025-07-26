import styles from './SettingsLayout.module.scss';

import { Outlet } from '@tanstack/react-router';

import { Sidebar } from '@/components/organisms/Sidebar/RepoSidebar/RepoSidebar';
import AuthHeader from '@/components/organisms/Header/AuthHeader/AuthHeader';

const SettingsLayout = () => {
  // const location = useLocation();
  // const settingsMenuItems = useMemo(() => {}, []);

  return (
    <div className={styles.settingsLayout}>
      <header className={styles.header}>
        <AuthHeader />
      </header>

      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>

      <main className={styles.contentArea}>
        <Outlet />
      </main>
    </div>
  );
};

export default SettingsLayout;
