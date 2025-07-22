import React from 'react';
import MenuItem from '@/components/molecules/MenuItem/MenuItem';
import InputMenuItem from '@/components/molecules/InputMenuItem/InputMenuItem';
import MeatballModal from '@/components/organisms/Modals/MeatballModal/MeatballModal';

export interface SharedWithMeRepoMeatballModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: { top: number; left: number };
  shareLink?: string;
  onShareLinkCopy?: () => void;
  onLeaveRepository?: () => void;
  className?: string;
}

const SharedWithMeRepoMeatballModal: React.FC<SharedWithMeRepoMeatballModalProps> = ({
  open,
  onOpenChange,
  position = { top: 0, left: 0 },
  shareLink = '',
  onShareLinkCopy,
  onLeaveRepository,
  className = '',
}) => {
  const handleShareLinkCopy = () => {
    if (shareLink && onShareLinkCopy) {
      navigator.clipboard.writeText(shareLink);
      onShareLinkCopy();
    }
  };

  const handleLeaveRepository = () => {
    if (onLeaveRepository) {
      onLeaveRepository();
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
      <InputMenuItem
        label="공유 링크"
        value={shareLink}
        iconPath="/src/assets/icons/copy.svg"
        onIconClick={handleShareLinkCopy}
        readOnly
      />

      <MenuItem
        label="공유받은 레포지토리 떠나기"
        iconPath="/src/assets/icons/user-minus.svg"
        onClick={handleLeaveRepository}
        variant="orange"
      />
    </MeatballModal>
  );
};

export default SharedWithMeRepoMeatballModal;
