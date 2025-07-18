import type { ReactNode } from 'react';
import styles from './AuthLayout.module.scss';
import Header from '@/components/Header/Header';

interface Props {
  children: ReactNode;
}

const AuthLayout = ({ children }: Props) => {
  return (
    <div className={styles.container}>
      <Header variant="auth" />
      <main className={styles.content}>{children}</main>
    </div>
  );
};

export default AuthLayout;
