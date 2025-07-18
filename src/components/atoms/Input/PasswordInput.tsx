import React, { useState, forwardRef } from 'react';
import Input from '@/components/atoms/Input/Input';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ ...props }, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Input
      ref={ref}
      type={isVisible ? 'text' : 'password'}
      variant="password"
      icon={
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={isVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
        >
          {isVisible ? (
            <svg width="16" height="16" viewBox="0 0 24 14">
              <path
                d="M8 0H16V2H8V0ZM4 4V2H8V4H4ZM2 6V4H4V6H2ZM2 8V6H0V8H2ZM4 10H2V8H4V10ZM8 12H4V10H8V12ZM16 12V14H8V12H16ZM20 10V12H16V10H20ZM22 8V10H20V8H22ZM22 6H24V8H22V6ZM20 4H22V6H20V4ZM20 4V2H16V4H20ZM10 5H14V9H10V5Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 10">
              <path
                d="M0 0H2V2H0V0ZM4 4H2V2H4V4ZM8 6V4H4V6H2V8H4V6H8ZM16 6H8V8H6V10H8V8H16V10H18V8H16V6ZM20 4H16V6H20V8H22V6H20V4ZM22 2V4H20V2H22ZM22 2V0H24V2H22Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      }
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
