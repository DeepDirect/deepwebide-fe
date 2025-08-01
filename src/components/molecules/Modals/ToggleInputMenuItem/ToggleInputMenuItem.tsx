import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './ToggleInputMenuItem.module.scss';
import EyeIcon from '@/assets/icons/eye.svg?react';
import EyeClosedIcon from '@/assets/icons/eye-closed.svg?react';

export interface ToggleInputMenuItemProps {
  label: string;
  expandedLabel?: string; // NOTE: 펼쳐졌을 때 사용할 라벨
  iconPath: string;
  expandedIconPath?: string; // NOTE: 펼쳐졌을 때 사용할 아이콘
  iconAlt?: string;
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
  isPassword?: boolean;
  onChange?: (value: string) => void;
  onToggle?: (isExpanded: boolean) => void;
  onIconClick?: () => void; // NOTE: 아이콘 클릭 이벤트 (복사 등)
  className?: string;
  initialExpanded?: boolean;
}

const ToggleInputMenuItem: React.FC<ToggleInputMenuItemProps> = ({
  label,
  expandedLabel,
  iconPath,
  expandedIconPath,
  iconAlt = '',
  value = '',
  placeholder = '',
  readOnly = false,
  isPassword = false,
  onChange,
  onToggle,
  onIconClick,
  className = '',
  initialExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isIconHovered, setIsIconHovered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (onToggle) {
      onToggle(newExpanded);
    }
  };

  const handleIconClick = () => {
    if (isExpanded) {
      // NOTE: 펼쳐진 상태에서 아이콘 클릭 시
      if (onIconClick) {
        onIconClick();
      }
    } else {
      // NOTE: 접힌 상태에서 아이콘 클릭 시
      handleToggle();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange && !readOnly) {
      onChange(e.target.value);
    }
  };

  const handlePasswordToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPassword(!showPassword);
  };

  // NOTE: 접힌 상태
  if (!isExpanded) {
    return (
      <div
        className={clsx(styles.menuItem, { [styles.hovered]: isHovered }, className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className={styles.label}>{label}</span>

        <div
          className={clsx(styles.iconWrapper, { [styles.iconHovered]: isIconHovered })}
          onMouseEnter={() => setIsIconHovered(true)}
          onMouseLeave={() => setIsIconHovered(false)}
          onClick={handleIconClick}
        >
          <img src={iconPath} alt={iconAlt} className={styles.icon} />
        </div>
      </div>
    );
  }

  // NOTE: 펼쳐진 상태 (InputMenuItem과 유사하지만 패스워드 토글 추가)
  return (
    <div className={clsx(styles.container, className)}>
      {/* 라벨과 아이콘 */}
      <div className={styles.labelRow}>
        <span className={styles.label}>{expandedLabel || label}</span>

        <div
          className={clsx(styles.iconWrapper, { [styles.iconHovered]: isIconHovered })}
          onMouseEnter={() => setIsIconHovered(true)}
          onMouseLeave={() => setIsIconHovered(false)}
          onClick={handleIconClick}
        >
          <img src={expandedIconPath || iconPath} alt={iconAlt} className={styles.icon} />
        </div>
      </div>

      {/* Input 필드 */}
      <div className={styles.inputWrapper}>
        <input
          type={isPassword && !showPassword ? 'password' : 'text'}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={handleInputChange}
          className={clsx(styles.input, { [styles.readOnlyInput]: readOnly })}
        />

        {/* 패스워드 보기/숨기기 아이콘 */}
        {isPassword && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={handlePasswordToggle}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {showPassword ? (
              <EyeIcon className={styles.eyeIcon} />
            ) : (
              <EyeClosedIcon className={styles.eyeIcon} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ToggleInputMenuItem;
