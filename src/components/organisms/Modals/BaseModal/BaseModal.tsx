import React from 'react';
import { Dialog } from 'radix-ui';
import Button from '@/components/atoms/Button/Button';
import { useScrollLock } from '@/hooks/common/useScrollLock';
import styles from './BaseModal.module.scss';

export interface BaseModalProps {
  // NOTE: 기본 모달 설정
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // 헤더 (고정)
  title: string;

  // 내용 (자유롭게 사용)
  children: React.ReactNode;

  // 푸터 (고정)
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;

  // 확인 버튼 상태 제어
  confirmVariant?: 'active' | 'general' | 'inactive';
  confirmDisabled?: boolean;
  confirmButtonType?: 'button' | 'submit' | 'reset';

  // 스타일
  className?: string;
  showCloseButton?: boolean;
}

const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onOpenChange,
  title,
  children,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  showCancel = true,
  confirmVariant = 'active',
  confirmDisabled = false,
  confirmButtonType = 'button',
  className = '',
}) => {
  useScrollLock(open);

  const handleConfirm = () => {
    if (onConfirm && !confirmDisabled) {
      onConfirm();
    }
    if (!confirmDisabled) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={`${styles.content} ${className}`}>
          {/* 헤더 - 고정 */}
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            <Dialog.Description className="srOnly" />
          </div>

          {/* 내용 - 자유롭게 사용 */}
          <div className={styles.body}>{children}</div>

          {/* 푸터 - 고정 */}
          <div className={styles.footer}>
            <Button
              variant={confirmVariant}
              onClick={handleConfirm}
              disabled={confirmDisabled}
              type={confirmButtonType}
              className={styles.confirmButton}
            >
              {confirmText}
            </Button>

            {showCancel && (
              <Button variant="general" onClick={handleCancel} className={styles.cancelButton}>
                {cancelText}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BaseModal;
