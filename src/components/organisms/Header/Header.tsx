import { Link } from '@tanstack/react-router';
import styles from './Header.module.scss';
import Logo from '@/components/atoms/Logo/Logo';
import UserProfile from './variants/UserProfile';
import RepoHeader from './variants/RepoHeader';
import Toggle from '@/components/atoms/Toggle/Toggle';

type HeaderProps = {
  variant: 'auth' | 'main' | 'repo';
  onChatButtonClick?: () => void;
};

const Header = ({ variant, onChatButtonClick }: HeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/main" title="메인페이지">
          <Logo size={240} clickable />
        </Link>
      </div>

      {variant === 'repo' && (
        <div className={styles.center}>
          <RepoHeader onChatButtonClick={onChatButtonClick} />
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
