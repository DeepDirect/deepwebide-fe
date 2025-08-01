import 'dayjs/locale/ko';
import dayjs from 'dayjs';
import React, { useEffect } from 'react';
import type { QueryObserverResult } from '@tanstack/react-query';

import FillHeartIcon from '@/assets/icons/fill-heart.svg?react';
import HeartIcon from '@/assets/icons/heart.svg?react';
import MeatballIcon from '@/assets/icons/meatball.svg?react';

import MainPageType from '@/constants/enums/MainPageType.enum';
import { useToast } from '@/hooks/common/useToast';

import { useRepoActions } from '@/hooks/main/useRepoActions';
import { useModalState } from '@/hooks/main/useModalState';
import { useMeatballModal } from '@/hooks/main/useMeatballModal';
import { useRepoActionHandlers } from './RepoActionHandlers';
import { MeatballModalRenderer } from './MeatballModalRenderer';

import CancelMyRepoShareAlertDialog from '@/features/AlertDialog/RepoOwner/CancelMyRepoShareAlertDialog';
import DeleteRepoAlertDialog from '@/features/AlertDialog/common/DeleteRepoAlertDialog';
import LeaveSharedRepoAlertDialog from '@/features/AlertDialog/RepoMember/LeaveSharedRepoAlertDialog';
import ShareMyRepoAlertDialog from '@/features/AlertDialog/RepoOwner/ShareMyRepoAlertDialog';
import ChangeRepoNameModal from '@/features/Modals/ChangeRepoNameModal/ChangeRepoNameModal';

import type { RepositoryItem, RepositoryApiResponse } from '@/schemas/repo.schema';
import styles from './RepoListItem.module.scss';

interface RepositoryProps {
  info: RepositoryItem;
  pageType: MainPageType;
  handleFavoriteClick: (id: number) => void;
  handleRepoClick: (id: number) => void;
  repositoryRefetch: () => Promise<QueryObserverResult<RepositoryApiResponse, unknown>>;
}

const RepoListItem: React.FC<RepositoryProps> = ({
  info,
  handleFavoriteClick,
  handleRepoClick,
  pageType,
  repositoryRefetch,
}) => {
  const toast = useToast();
  const { modals, toggleModal } = useModalState();
  const { isOpen, setIsOpen, position, meatballRef, handleClick } = useMeatballModal(pageType);

  const actions = useRepoActions(info.repositoryId, pageType, repositoryRefetch);
  const { handleRename, handleShareLinkCopy, handleEntryCodeCopy } = useRepoActionHandlers(
    actions,
    repositoryRefetch
  );

  // 에러 처리
  useEffect(() => {
    if (actions.entryCode.isError) {
      toast.error(actions.entryCode.error.message);
    }
  }, [actions.entryCode.isError, actions.entryCode.error, toast]);

  return (
    <div className={styles.repositoryWrapper}>
      <div
        role="button"
        className={`${styles.nameWrapper} ${styles.nameButton}`}
        onClick={() => handleRepoClick(info.repositoryId)}
      >
        <span>{info.repositoryName}</span>
      </div>

      <div className={styles.infoContainer}>
        {pageType === MainPageType.SHARED_WITH_ME && (
          <div className={`${styles.infoWrapper} ${styles.ownerNameWrapper}`}>
            <span>{info.ownerName}</span>
          </div>
        )}
        <div className={`${styles.infoWrapper} ${styles.updateWrapper}`}>
          <span className={styles.updateTitle}>마지막 수정일 :</span>
          <span className={styles.date}>
            {dayjs(info.updatedAt).locale('ko').format('YYYY-MM-DD')}
          </span>
        </div>

        <div className={styles.iconWrapper}>
          <button
            className={styles.iconButton}
            onClick={() => handleFavoriteClick(info.repositoryId)}
          >
            {info.isFavorite ? <FillHeartIcon className={styles.checked} /> : <HeartIcon />}
          </button>
        </div>

        <div className={styles.iconWrapper}>
          <button className={styles.iconButton} ref={meatballRef} onClick={handleClick}>
            <MeatballIcon />
          </button>
        </div>
      </div>

      {isOpen && meatballRef.current && (
        <MeatballModalRenderer
          pageType={pageType}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          position={position}
          shareLink={info.shareLink}
          entryCode={actions.entryCode.data?.data.entryCode}
          onShare={() => toggleModal('shareMyRepoAlertDialog')}
          onRename={() => toggleModal('changeRepoName')}
          onDelete={() => toggleModal('deleteRepoAlert')}
          onShareLinkCopy={() => handleShareLinkCopy(info.shareLink)}
          onEntryCodeCopy={() => handleEntryCodeCopy(actions.entryCode.data?.data.entryCode)}
          onCancelShare={() => toggleModal('cancelMyRepoShareAlert')}
          onLeaveRepository={() => toggleModal('leaveSharedRepoAlertDialog')}
        />
      )}

      {/* Alert Dialogs */}
      <ChangeRepoNameModal
        open={modals.changeRepoName}
        onOpenChange={() => toggleModal('changeRepoName')}
        currentName={info.repositoryName}
        onConfirm={handleRename}
        onCancel={() => toggleModal('changeRepoName')}
      />
      <DeleteRepoAlertDialog
        open={modals.deleteRepoAlert}
        onOpenChange={() => toggleModal('deleteRepoAlert')}
        onConfirm={actions.deleteRepo.mutate}
        onCancel={() => toggleModal('deleteRepoAlert')}
      />
      <ShareMyRepoAlertDialog
        open={modals.shareMyRepoAlertDialog}
        onOpenChange={() => toggleModal('shareMyRepoAlertDialog')}
        onConfirm={actions.shareStatus.mutate}
        onCancel={() => toggleModal('shareMyRepoAlertDialog')}
      />
      <CancelMyRepoShareAlertDialog
        open={modals.cancelMyRepoShareAlert}
        onOpenChange={() => toggleModal('cancelMyRepoShareAlert')}
        onConfirm={actions.shareStatus.mutate}
        onCancel={() => toggleModal('cancelMyRepoShareAlert')}
      />
      <LeaveSharedRepoAlertDialog
        open={modals.leaveSharedRepoAlertDialog}
        onOpenChange={() => toggleModal('leaveSharedRepoAlertDialog')}
        onConfirm={actions.exit.mutate}
        onCancel={() => toggleModal('leaveSharedRepoAlertDialog')}
      />
    </div>
  );
};

export default RepoListItem;
