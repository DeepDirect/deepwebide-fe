import React from 'react';
import AlertDialog from '@/components/molecules/AlertDialog/AlertDialog';

export interface RemoveMemberAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const RemoveMemberAlertDialog: React.FC<RemoveMemberAlertDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="해당 멤버를 정말 추방하시겠습니까?"
      confirmText="추방하기"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default RemoveMemberAlertDialog;
