import React from 'react';
import AlertDialog from '@/components/molecules/AlertDialog/AlertDialog';

export interface CancelMyRepoShareAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const CancelMyRepoShareAlertDialog: React.FC<CancelMyRepoShareAlertDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="레포지토리 공유를 취소하시겠습니까?"
      confirmText="공유 취소"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default CancelMyRepoShareAlertDialog;
