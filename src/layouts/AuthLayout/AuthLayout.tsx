import { Outlet } from '@tanstack/react-router';
import styles from './AuthLayout.module.scss';
import Header from '@/components/Header/Header';

const AuthLayout = () => {
  return (
    <div className={styles.container}>
      <Header variant="auth" />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
