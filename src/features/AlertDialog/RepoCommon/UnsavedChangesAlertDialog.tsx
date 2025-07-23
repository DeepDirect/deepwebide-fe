import React from 'react';
import AlertDialog from '@/components/molecules/AlertDialog/AlertDialog';

export interface UnsavedChangesAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const UnsavedChangesAlertDialog: React.FC<UnsavedChangesAlertDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="변경사항을 저장하시겠습니까?"
      confirmText="저장하기"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default UnsavedChangesAlertDialog;
