import styles from './SettingsLayout.module.scss';

import { Outlet } from '@tanstack/react-router';

import { Sidebar } from '@/components/organisms/Sidebar/RepoSidebar/RepoSidebar';
import MainHeader from '@/components/organisms/Header/MainHeader/MainHeader';

const SettingsLayout = () => {
  // const location = useLocation();
  // const settingsMenuItems = useMemo(() => {}, []);

  return (
    <div className={styles.settingsLayout}>
      <header className={styles.header}>
        <MainHeader />
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
