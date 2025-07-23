import logo from '@/assets/images/logo.svg';
import smallLogo from '@/assets/images/glasses.svg';
import styles from './Logo.module.scss';

type LogoProps = {
  size?: number;
  clickable?: boolean;
  onClick?: () => void;
};

const Logo = ({ clickable = false, onClick }: LogoProps) => {
  return (
    <picture className={styles.wrapper}>
      <source srcSet={logo} media="(min-width: 768px)" />
      <img
        className={styles.img}
        src={smallLogo}
        alt="DeepDirect 로고"
        style={{ cursor: clickable ? 'pointer' : 'default' }}
        onClick={onClick}
      />
    </picture>
  );
};

export default Logo;
