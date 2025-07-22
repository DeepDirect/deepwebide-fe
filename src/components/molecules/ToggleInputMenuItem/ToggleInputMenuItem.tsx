import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './ToggleInputMenuItem.module.scss';

export interface ToggleInputMenuItemProps {
  label: string;
  iconPath: string;
  iconAlt?: string;
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
  isPassword?: boolean;
  onChange?: (value: string) => void;
  onToggle?: (isExpanded: boolean) => void;
  className?: string;
  initialExpanded?: boolean;
}

const ToggleInputMenuItem: React.FC<ToggleInputMenuItemProps> = ({
  label,
  iconPath,
  iconAlt = '',
  value = '',
  placeholder = '',
  readOnly = false,
  isPassword = false,
  onChange,
  onToggle,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange && !readOnly) {
      onChange(e.target.value);
    }
  };

  const handlePasswordToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPassword(!showPassword);
  };

  // 접힌 상태 (MenuItem과 동일)
  if (!isExpanded) {
    return (
      <div
        className={clsx(styles.menuItem, { [styles.hovered]: isHovered }, className)}
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className={styles.label}>{label}</span>

        <div
          className={clsx(styles.iconWrapper, { [styles.iconHovered]: isIconHovered })}
          onMouseEnter={() => setIsIconHovered(true)}
          onMouseLeave={() => setIsIconHovered(false)}
        >
          <img src={iconPath} alt={iconAlt} className={styles.icon} />
        </div>
      </div>
    );
  }

  // 펼쳐진 상태 (InputMenuItem과 유사하지만 패스워드 토글 추가)
  return (
    <div className={clsx(styles.container, className)}>
      {/* 라벨과 아이콘 */}
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>

        <div
          className={clsx(styles.iconWrapper, { [styles.iconHovered]: isIconHovered })}
          onMouseEnter={() => setIsIconHovered(true)}
          onMouseLeave={() => setIsIconHovered(false)}
          onClick={handleToggle}
        >
          <img src={iconPath} alt={iconAlt} className={styles.icon} />
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
            <img
              src={showPassword ? 'src/assets/icons/eye.svg' : 'src/assets/icons/eye-closed.svg'}
              alt={showPassword ? '숨기기' : '보기'}
              className={styles.eyeIcon}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default ToggleInputMenuItem;
