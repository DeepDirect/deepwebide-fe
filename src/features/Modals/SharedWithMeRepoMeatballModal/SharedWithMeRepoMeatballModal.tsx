import React from 'react';
import MenuItem from '@/components/molecules/Modals/MenuItem/MenuItem';
import InputMenuItem from '@/components/molecules/Modals/InputMenuItem/InputMenuItem';
import MeatballModal from '@/components/organisms/Modals/MeatballModal/MeatballModal';
import copyIcon from '@/assets/icons/copy.svg';
import userMinusIcon from '@/assets/icons/user-minus.svg';

export interface SharedWithMeRepoMeatballModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: { top?: number; bottom?: number; left?: number; right?: number };
  shareLink?: string;
  onShareLinkCopy?: () => void;
  onLeaveRepository?: () => void;
  className?: string;
}

const SharedWithMeRepoMeatballModal: React.FC<SharedWithMeRepoMeatballModalProps> = ({
  open,
  onOpenChange,
  position,
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
        iconPath={copyIcon}
        onIconClick={handleShareLinkCopy}
        readOnly
      />

      <MenuItem
        label="공유받은 레포지토리 떠나기"
        iconPath={userMinusIcon}
        onClick={handleLeaveRepository}
        variant="orange"
      />
    </MeatballModal>
  );
};

export default SharedWithMeRepoMeatballModal;
