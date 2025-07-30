import React from 'react';
import MainPageType from '@/constants/enums/MainPageType.enum';
import PrivateRepoMeatballModal from '@/features/Modals/PrivateRepoMeatballModal/PrivateRepoMeatballModal';
import SharedByMeRepoMeatballModal from '@/features/Modals/SharedByMeRepoMeatballModal/SharedByMeRepoMeatballModal';
import SharedWithMeRepoMeatballModal from '@/features/Modals/SharedWithMeRepoMeatballModal/SharedWithMeRepoMeatballModal';

interface MeatballModalRendererProps {
  pageType: MainPageType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  position: Record<string, number>;
  shareLink: string;
  entryCode?: string;
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
  onShareLinkCopy: () => void;
  onEntryCodeCopy: () => void;
  onCancelShare: () => void;
  onLeaveRepository: () => void;
}

export const MeatballModalRenderer: React.FC<MeatballModalRendererProps> = ({
  pageType,
  isOpen,
  onOpenChange,
  position,
  shareLink,
  entryCode,
  onShare,
  onRename,
  onDelete,
  onShareLinkCopy,
  onEntryCodeCopy,
  onCancelShare,
  onLeaveRepository,
}) => {
  switch (pageType) {
    case MainPageType.PRIVATE_REPO:
      return (
        <PrivateRepoMeatballModal
          open={isOpen}
          onOpenChange={onOpenChange}
          position={position}
          onShare={onShare}
          onRename={onRename}
          onDelete={onDelete}
        />
      );

    case MainPageType.SHARED_BY_ME:
      return (
        <SharedByMeRepoMeatballModal
          open={isOpen}
          onOpenChange={onOpenChange}
          position={position}
          shareLink={shareLink}
          entryCode={entryCode}
          onRename={onRename}
          onShareLinkCopy={onShareLinkCopy}
          onEntryCodeCopy={onEntryCodeCopy}
          onCancelShare={onCancelShare}
        />
      );

    case MainPageType.SHARED_WITH_ME:
      return (
        <SharedWithMeRepoMeatballModal
          open={isOpen}
          onOpenChange={onOpenChange}
          position={position}
          shareLink={shareLink}
          onShareLinkCopy={onShareLinkCopy}
          onLeaveRepository={onLeaveRepository}
        />
      );

    default:
      return null;
  }
};
