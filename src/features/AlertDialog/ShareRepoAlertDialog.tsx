import React from 'react';
import AlertDialog from '@/components/molecules/AlertDialog/AlertDialog';

export interface ShareRepoAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const ShareRepoAlertDialog: React.FC<ShareRepoAlertDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="개인 레포지토리를 공유하시겠습니까?"
      confirmText="공유하기"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default ShareRepoAlertDialog;
