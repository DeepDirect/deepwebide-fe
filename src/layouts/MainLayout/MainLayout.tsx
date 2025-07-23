import styles from './MainLayout.module.scss';

import { Outlet } from '@tanstack/react-router';

import Header from '@/components/organisms/Header/Header';
import { Sidebar } from '@/components/organisms/Sidebar/MainSidebar/MainSidebar';

const MainLayout = () => {
  return (
    <div className={styles.mainLayout}>
      <Header variant="main" />

      <Sidebar />

      <Outlet />
    </div>
  );
};

export default MainLayout;
