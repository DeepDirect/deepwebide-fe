import React from 'react';
import Button from '@/components/atoms/Button/Button';

import './EntryCodeSubmitButton.scss';

interface EntryCodeSubmitButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

const EntryCodeSubmitButton: React.FC<EntryCodeSubmitButtonProps> = ({
  children,
  onClick,
  disabled = false,
}) => {
  const buttonVariant = disabled ? 'general' : 'active';

  return (
    <div className="entry-code-submit-button">
      <Button
        variant={buttonVariant}
        onClick={disabled ? undefined : onClick}
        className="entry-code-submit-button__inner"
      >
        {children}
      </Button>
    </div>
  );
};

export default EntryCodeSubmitButton;
