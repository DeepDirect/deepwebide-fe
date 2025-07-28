import { Link } from '@tanstack/react-router';
import styles from './MainHeader.module.scss';
import Logo from '@/components/atoms/Logo/Logo';
import UserProfile from '@/components/organisms/Header/UserProfile/UserProfile';

const MainHeader = () => {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/main" title="메인페이지">
          <Logo size={240} clickable />
        </Link>
      </div>

      <div className={styles.right}>
        <UserProfile variant="lightModeOnly" />
      </div>
    </header>
  );
};

export default MainHeader;
