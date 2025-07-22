import React from 'react';
import { AlertDialog } from 'radix-ui';
import Button from '@/components/atoms/Button/Button';
import styles from './AlertDialog.module.scss';

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  className?: string;
}

const AlertDialogComponent: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  showCancel = true,
  className = '',
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.overlay} />
        <AlertDialog.Content className={`${styles.content} ${className}`}>
          {/* 제목 */}
          <AlertDialog.Title className={styles.title}>{title}</AlertDialog.Title>

          {/* 설명 - 접근성을 위해 항상 렌더링 */}
          <AlertDialog.Description className={styles.description}>
            {description || ' '} {/* 빈 설명이면 공백 문자 */}
          </AlertDialog.Description>

          {/* 버튼들 */}
          <div className={styles.buttons}>
            <AlertDialog.Action asChild>
              <Button variant="active" onClick={handleConfirm} className={styles.confirmButton}>
                {confirmText}
              </Button>
            </AlertDialog.Action>

            {showCancel && (
              <AlertDialog.Cancel asChild>
                <Button variant="general" onClick={handleCancel} className={styles.cancelButton}>
                  {cancelText}
                </Button>
              </AlertDialog.Cancel>
            )}
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default AlertDialogComponent;
