import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './MenuItem.module.scss';

export interface MenuItemProps {
  label: string;
  iconPath: string;
  iconAlt?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'red' | 'green' | 'orange';
}

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  iconPath,
  iconAlt = '',
  onClick,
  className = '',
  variant = 'default',
}) => {
  const [isIconHovered, setIsIconHovered] = useState(false);

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={clsx(styles.menuItem, className)} data-variant={variant}>
      <span className={styles.label}>{label}</span>

      <div
        className={clsx(styles.iconWrapper, {
          [styles.iconHovered]: isIconHovered,
        })}
        onMouseEnter={() => setIsIconHovered(true)}
        onMouseLeave={() => setIsIconHovered(false)}
        onClick={handleIconClick}
      >
        <img src={iconPath} alt={iconAlt} className={styles.icon} />
      </div>
    </div>
  );
};

export default MenuItem;
