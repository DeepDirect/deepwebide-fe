import React from 'react';
import './Button.scss';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'active' | 'general' | 'inactive';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'general',
  onClick,
  className = '',
  style,
  type = 'button',
  disabled = false,
}) => {
  const buttonClass = `btn btn--${variant} ${className}`.trim();

  return (
    <button
      type={type || 'button'}
      className={buttonClass}
      onClick={onClick}
      style={style}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
