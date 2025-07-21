import React, { useState } from 'react';
import styles from './InputMenuItem.module.scss';

export interface InputMenuItemProps {
  label: string;
  iconPath: string;
  iconAlt?: string;
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onIconClick?: () => void;
  className?: string;
}

const InputMenuItem: React.FC<InputMenuItemProps> = ({
  label,
  iconPath,
  iconAlt = '',
  value = '',
  placeholder = '',
  readOnly = false,
  onChange,
  onIconClick,
  className = '',
}) => {
  const [isIconHovered, setIsIconHovered] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange && !readOnly) {
      onChange(e.target.value);
    }
  };

  const handleIconClick = () => {
    if (onIconClick) {
      onIconClick();
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* 라벨과 아이콘 */}
      <div className={styles.labelRow}>
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

      {/* Input 필드 */}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={handleInputChange}
        className={`${styles.input} ${readOnly ? styles.readOnlyInput : ''}`}
      />
    </div>
  );
};

export default InputMenuItem;
