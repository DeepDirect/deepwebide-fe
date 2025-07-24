import React from 'react';
import MenuItem from '@/components/molecules/Modals/MenuItem/MenuItem';
import MeatballModal from '@/components/organisms/Modals/MeatballModal/MeatballModal';

export interface PrivateRepoMeatballModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: { top?: number; bottom?: number; left?: number; right?: number };
  onRename?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  className?: string;
}

const PrivateRepoMeatballModal: React.FC<PrivateRepoMeatballModalProps> = ({
  open,
  onOpenChange,
  position,
  onRename,
  onShare,
  onDelete,
  className = '',
}) => {
  const handleRename = () => {
    if (onRename) {
      onRename();
    }
    onOpenChange(false);
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    onOpenChange(false);
  };

  return (
    <MeatballModal
      open={open}
      onOpenChange={onOpenChange}
      position={position}
      className={className}
    >
      <MenuItem
        label="이름 변경하기"
        iconPath="/src/assets/icons/edit-box.svg"
        onClick={handleRename}
        variant="default"
      />

      <MenuItem
        label="공유하기"
        iconPath="/src/assets/icons/forward.svg"
        onClick={handleShare}
        variant="default"
      />

      <MenuItem
        label="삭제하기"
        iconPath="/src/assets/icons/trash.svg"
        onClick={handleDelete}
        variant="red"
      />
    </MeatballModal>
  );
};

export default PrivateRepoMeatballModal;
