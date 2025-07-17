import React from 'react';
import './Button.scss';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'active' | 'general' | 'inactive';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'general',
  onClick,
  className = '',
  style,
}) => {
  const buttonClass = `btn btn--${variant} ${className}`.trim();

  return (
    <button type="button" className={buttonClass} onClick={onClick} style={style}>
      {children}
    </button>
  );
};

export default Button;
