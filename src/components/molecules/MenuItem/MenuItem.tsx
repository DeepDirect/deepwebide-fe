import React, { useState } from 'react';
import styles from './MenuItem.module.scss';

export interface MenuItemProps {
  label: string;
  iconPath: string;
  iconAlt?: string;
  onClick?: () => void;
  className?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  iconPath,
  iconAlt = '',
  onClick,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isIconHovered, setIsIconHovered] = useState(false);

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`${styles.menuItem} ${isHovered ? styles.hovered : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={styles.label}>{label}</span>

      <div
        className={`${styles.iconWrapper} ${isIconHovered ? styles.iconHovered : ''}`}
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
