import React, { forwardRef } from 'react';
import './Input.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'password';
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', icon, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`input-container ${className}`}>
        <div className={`input-wrapper ${variant === 'password' ? 'input-wrapper--password' : ''}`}>
          <input ref={ref} id={inputId} className="input" {...props} />
          {icon && <div className="input-icon">{icon}</div>}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
