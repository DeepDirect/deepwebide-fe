import styles from './SettingsLayout.module.scss';

import { Outlet } from '@tanstack/react-router';

import { Sidebar } from '@/components/organisms/Sidebar/RepoSidebar/RepoSidebar';
import Header from '@/components/organisms/Header/Header';

const SettingsLayout = () => {
  // const location = useLocation();
  // const settingsMenuItems = useMemo(() => {}, []);

  return (
    <div className={styles.settingsLayout}>
      <Header variant="auth" />

      <Sidebar />

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
};

export default SettingsLayout;
