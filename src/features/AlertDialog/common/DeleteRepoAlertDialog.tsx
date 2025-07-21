import React from 'react';
import AlertDialog from '@/components/molecules/AlertDialog/AlertDialog';

export interface DeleteRepoAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const DeleteRepoAlertDialog: React.FC<DeleteRepoAlertDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="개인 레포지토리를 삭제하시겠습니까?"
      confirmText="삭제하기"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default DeleteRepoAlertDialog;
