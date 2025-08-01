import React from 'react';
import clsx from 'clsx';
import { DropdownMenu } from 'radix-ui';
import { useThemeStore } from '@/stores/themeStore';
import styles from './ProfileDropdown.module.scss';
import LogoutIcon from '@/assets/icons/logout.svg?react';

export interface ProfileDropdownProps {
  onLogout?: () => void;
  className?: string;
  children: React.ReactNode;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onLogout,
  className = '',
  children,
}) => {
  const { isDarkMode } = useThemeStore();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={clsx(styles.content, className)}
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Item className={styles.item} onClick={handleLogout}>
            <LogoutIcon className={clsx(styles.icon, { [styles.darkIcon]: isDarkMode })} />
            <span className={styles.label}>로그아웃</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default ProfileDropdown;
