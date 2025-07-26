import { Link } from '@tanstack/react-router';
import styles from './AuthHeader.module.scss';
import Logo from '@/components/atoms/Logo/Logo';

const AuthHeader = () => {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/main" title="메인페이지">
          <Logo size={240} clickable />
        </Link>
      </div>
    </header>
  );
};

export default AuthHeader;
