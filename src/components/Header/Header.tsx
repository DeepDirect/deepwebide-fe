import styles from './Header.module.scss';
import Logo from '@/components/atoms/Logo';
import MainHeader from './variants/Main';
import RepoLightHeader from './variants/RepoLight';
import RepoDarkHeader from './variants/RepoDark';

type HeaderProps = {
  variant: 'auth' | 'main' | 'repo-light' | 'repo-dark';
};

const Header = ({ variant }: HeaderProps) => {
  const renderContent = () => {
    switch (variant) {
      case 'auth':
        return null;
      case 'main':
        return <MainHeader />;
      case 'repo-light':
        return <RepoLightHeader />;
      case 'repo-dark':
        return <RepoDarkHeader />;
      default:
        return null;
    }
  };

  return (
    <header className={styles.header}>
      <Logo size={240} clickable />
      {renderContent()}
    </header>
  );
};

export default Header;
