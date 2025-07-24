import React from 'react';
import AlertDialog from '@/components/molecules/AlertDialog/AlertDialog';

export interface ExitRepoAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const ExitRepoAlertDialog: React.FC<ExitRepoAlertDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="레포 작업을 종료하시겠습니까?"
      confirmText="종료"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default ExitRepoAlertDialog;
