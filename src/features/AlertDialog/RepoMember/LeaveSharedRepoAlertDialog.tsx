import React from 'react';
import AlertDialog from '@/components/molecules/AlertDialog/AlertDialog';

export interface LeaveSharedRepoAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const LeaveSharedRepoAlertDialog: React.FC<LeaveSharedRepoAlertDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="공유받은 레포지토리에서 떠나시겠습니까?"
      confirmText="떠나기"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default LeaveSharedRepoAlertDialog;
