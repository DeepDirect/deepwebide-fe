import logo from '@/assets/images/logo.svg';
import smallLogo from '@/assets/images/glasses.svg';
import styles from './Logo.module.scss';

type LogoProps = {
  size?: number;
  clickable?: boolean;
  onClick?: () => void;
};

const Logo = ({ size = 240, clickable = false, onClick }: LogoProps) => {
  const height = (size / 240) * 45;

  return (
    <picture className={styles.wrapper}>
      <source srcSet={smallLogo} media="(max-width: 768px)" />
      <img
        className={styles.img}
        src={logo}
        alt="DeepDirect 로고"
        width={size}
        height={height}
        style={{ cursor: clickable ? 'pointer' : 'default' }}
        onClick={onClick}
      />
    </picture>
  );
};

export default Logo;
