import styles from './Header.module.scss';
import Logo from '@/components/atoms/Logo/Logo';
import UserProfile from './variants/UserProfile';
import RepoHeader from './variants/RepoHeader';
import Toggle from '@/components/atoms/Toggle/Toggle';

type HeaderProps = {
  variant: 'auth' | 'main' | 'repo';
};

const Header = ({ variant }: HeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Logo size={240} clickable />
      </div>

      {variant === 'repo' && (
        <div className={styles.center}>
          <RepoHeader />
        </div>
      )}

      <div className={styles.right}>
        {variant === 'repo' && <Toggle variant="theme" />}
        {(variant === 'main' || variant === 'repo') && <UserProfile />}
      </div>
    </header>
  );
};

export default Header;
