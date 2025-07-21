import React from 'react';
import styles from './MeatballModal.module.scss';

export interface MeatballModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  position?: { top: number; left: number };
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
      <div
        className={`${styles.content} ${className}`}
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        {children}
      </div>
    </>
  );
};

export default MeatballModal;
