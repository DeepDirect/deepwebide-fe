import React, { useState } from 'react';
import MenuItem from '@/components/molecules/Modals/MenuItem/MenuItem';
import InputMenuItem from '@/components/molecules/Modals/InputMenuItem/InputMenuItem';
import ToggleInputMenuItem from '@/components/molecules/Modals/ToggleInputMenuItem/ToggleInputMenuItem';
import MeatballModal from '@/components/organisms/Modals/MeatballModal/MeatballModal';

export interface SharedByMeRepoMeatballModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: { top: number; left: number };
  shareLink?: string;
  entryCode?: string;
  onRename?: () => void;
  onShareLinkCopy?: () => void;
  onEntryCodeCopy?: () => void;
  onCancelShare?: () => void;
  className?: string;
}

const SharedByMeRepoMeatballModal: React.FC<SharedByMeRepoMeatballModalProps> = ({
  open,
  onOpenChange,
  position = { top: 0, left: 0 },
  shareLink = '',
  entryCode = '',
  onRename,
  onShareLinkCopy,
  onEntryCodeCopy,
  onCancelShare,
  className = '',
}) => {
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);

  const handleRename = () => {
    if (onRename) {
      onRename();
    }
    onOpenChange(false);
  };

  const handleShareLinkCopy = () => {
    if (shareLink && onShareLinkCopy) {
      navigator.clipboard.writeText(shareLink);
      onShareLinkCopy();
    }
    onOpenChange(false);
  };

  const handleEntryCodeCopy = () => {
    if (entryCode && onEntryCodeCopy) {
      navigator.clipboard.writeText(entryCode);
      onEntryCodeCopy();
    }
    onOpenChange(false);
  };

  const handleCancelShare = () => {
    if (onCancelShare) {
      onCancelShare();
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
        iconPath="src/assets/icons/edit-box.svg"
        onClick={handleRename}
      />

      <InputMenuItem
        label="공유 링크"
        iconPath="src/assets/icons/copy.svg"
        value={shareLink}
        readOnly
        onIconClick={handleShareLinkCopy}
      />

      <ToggleInputMenuItem
        key={open ? 'open' : 'closed'}
        label="입장 코드 확인하기"
        expandedLabel="입장 코드"
        iconPath="src/assets/icons/arrow-down-box.svg"
        expandedIconPath="src/assets/icons/copy.svg"
        value={entryCode}
        isPassword={true}
        readOnly
        onToggle={isExpanded => {
          setIsCodeExpanded(isExpanded);
        }}
        onIconClick={() => {
          if (isCodeExpanded) {
            handleEntryCodeCopy();
          }
        }}
      />

      <MenuItem
        label="공유 취소하기"
        iconPath="src/assets/icons/mail-off.svg"
        onClick={handleCancelShare}
        variant="orange"
      />
    </MeatballModal>
  );
};

export default SharedByMeRepoMeatballModal;
