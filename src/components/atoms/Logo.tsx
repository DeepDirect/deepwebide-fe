import logo from '@/assets/images/logo.svg';

type LogoProps = {
  size?: number;
  clickable?: boolean;
  onClick?: () => void;
};

const Logo = ({ size = 240, clickable = false, onClick }: LogoProps) => {
  return (
    <img
      src={logo}
      alt="DeepDirect 로고"
      width={size}
      height={(size / 240) * 45}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
      onClick={onClick}
    />
  );
};

export default Logo;
