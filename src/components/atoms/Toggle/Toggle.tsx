import { useThemeStore } from '@/stores/themeStore';
import * as Switch from '@radix-ui/react-switch';
import styles from './Toggle.module.scss';
import FavoriteIcon from '@/assets/icons/heart.svg?react';

type ToggleProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  variant?: 'theme' | 'favorite' | 'default';
};

const Toggle = ({ checked, defaultChecked, onCheckedChange, variant = 'default' }: ToggleProps) => {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const isThemeToggle = variant === 'theme';

  return (
    <Switch.Root
      className={`${styles.root} ${styles[variant]}`}
      checked={isThemeToggle ? isDarkMode : checked}
      defaultChecked={isThemeToggle ? undefined : defaultChecked}
      onCheckedChange={isThemeToggle ? toggleTheme : onCheckedChange}
    >
      {/* <Switch.Thumb className={styles.thumb} /> */}
      <Switch.Thumb className={`${styles.thumb} ${isThemeToggle ? styles.themeThumb : ''}`}>
        {!isThemeToggle && <FavoriteIcon className={styles.thumbIcon} />}
      </Switch.Thumb>
    </Switch.Root>
  );
};

export default Toggle;
