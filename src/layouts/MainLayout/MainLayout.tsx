import styles from './MainLayout.module.scss';

import { Outlet } from '@tanstack/react-router';

import Header from '@/components/Header/Header';

const MainLayout = () => {
  return (
    <div className={styles.mainLayout}>
      <Header variant="main" />
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
