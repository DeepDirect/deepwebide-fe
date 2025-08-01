import React from 'react';
import clsx from 'clsx';
import styles from './MeatballModal.module.scss';

export interface MeatballModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  position?: { top?: number; bottom?: number; left?: number; right?: number };
}

const MeatballModal: React.FC<MeatballModalProps> = ({
  open,
  onOpenChange,
  children,
  className = '',
  position = { top: 0, left: 0 },
}) => {
  if (!open) return null;

  const handleBackdropClick = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <>
      <div className={styles.backdrop} onClick={handleBackdropClick} />
      <div className={clsx(styles.content, className)} style={position}>
        {children}
      </div>
    </>
  );
};

export default MeatballModal;
