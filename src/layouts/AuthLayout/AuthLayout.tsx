import { Outlet } from '@tanstack/react-router';
import styles from './AuthLayout.module.scss';
import AuthHeader from '@/components/organisms/Header/AuthHeader/AuthHeader';

const AuthLayout = () => {
  return (
    <div className={styles.container}>
      <AuthHeader />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
