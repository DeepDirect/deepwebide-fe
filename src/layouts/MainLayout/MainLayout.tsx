import styles from './MainLayout.module.scss';

import { Outlet } from '@tanstack/react-router';

import MainHeader from '@/components/organisms/Header/MainHeader/MainHeader';
import { Sidebar } from '@/components/organisms/Sidebar/MainSidebar/MainSidebar';

const MainLayout = () => {
  return (
    <div className={styles.mainLayout}>
      <MainHeader />

      <Sidebar />

      <Outlet />
    </div>
  );
};

export default MainLayout;
