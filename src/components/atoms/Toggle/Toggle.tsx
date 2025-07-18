// src/components/atoms/ThemeToggle.tsx
import * as Switch from '@radix-ui/react-switch';
import styles from './Toggle.module.scss';

type ToggleProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  variant?: 'theme' | 'favorite' | 'default';
};

const Toggle = ({ checked, defaultChecked, onCheckedChange, variant = 'default' }: ToggleProps) => {
  return (
    <Switch.Root
      className={`${styles.root} ${styles[variant]}`}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
    >
      <Switch.Thumb className={styles.thumb} />
    </Switch.Root>
  );
};

export default Toggle;
