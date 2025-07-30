import 'dayjs/locale/ko';

import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import type { QueryObserverResult } from '@tanstack/react-query';

import FillHeartIcon from '@/assets/icons/fill-heart.svg?react';
import HeartIcon from '@/assets/icons/heart.svg?react';
import MeatballIcon from '@/assets/icons/meatball.svg?react';

import MainPageType from '@/constants/enums/MainPageType.enum';

import useDeleteRepository from '@/hooks/main/useDeleteRepository';
import useGetRepositoryEntrycode from '@/hooks/common/useGetRepositoryEntrycode';
import useRepositoryExit from '@/hooks/common/useRepositoryExit';
import useRepositoryRename from '@/hooks/common/useRepositoryRename';
import useShareRepositoryStatus from '@/hooks/common/useShareRepositoryStatus';

import CancelMyRepoShareAlertDialog from '@/features/AlertDialog/RepoOwner/CancelMyRepoShareAlertDialog';
import DeleteRepoAlertDialog from '@/features/AlertDialog/common/DeleteRepoAlertDialog';
import LeaveSharedRepoAlertDialog from '@/features/AlertDialog/RepoMember/LeaveSharedRepoAlertDialog';
import ShareMyRepoAlertDialog from '@/features/AlertDialog/RepoOwner/ShareMyRepoAlertDialog';
import ChangeRepoNameModal from '@/features/Modals/ChangeRepoNameModal/ChangeRepoNameModal';
import PrivateRepoMeatballModal from '@/features/Modals/PrivateRepoMeatballModal/PrivateRepoMeatballModal';
import SharedByMeRepoMeatballModal from '@/features/Modals/SharedByMeRepoMeatballModal/SharedByMeRepoMeatballModal';
import SharedWithMeRepoMeatballModal from '@/features/Modals/SharedWithMeRepoMeatballModal/SharedWithMeRepoMeatballModal';

import type { RepositoryItem, RepositoryApiResponse } from '@/schemas/repo.schema';

import styles from './RepoListItem.module.scss';

type RepositoryProps = {
  info: RepositoryItem;
  pageType: MainPageType;
  handleFavoriteClick: (id: number) => void;
  handleRepoClick: (id: number) => void;
  repositoryRefetch: () => Promise<QueryObserverResult<RepositoryApiResponse, unknown>>;
};

type positionType = {
  top?: number;
  bottom?: number;
  right?: number;
  left?: number;
};

const textCopy = async (text: string, successMessage: string, failMessage: string) => {
  // TODO: return 값 boolean으로 변경 후 토스트 메시지 출력 되도록 변경해야 함.
  try {
    await navigator.clipboard.writeText(text);
    alert(successMessage);
    // return true;
  } catch {
    alert(failMessage);
    // return false;
  }
};

const RepoListItem: React.FC<RepositoryProps> = ({
  info,
  handleFavoriteClick,
  handleRepoClick,
  pageType,
  repositoryRefetch,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState<positionType>({});
  const meatballRef = useRef<HTMLButtonElement>(null);
  const [isModlasOpen, setIsModalsOpen] = useState({
    pageModal: false,
    changeRepoName: false,
    deleteRepoAlert: false,
    shareMyRepoAlertDialog: false,
    cancelMyRepoShareAlert: false,
    leaveSharedRepoAlertDialog: false,
  });
  const {
    mutate: renameRepository,
    // isLoading: isRenaming,
  } = useRepositoryRename(`/api/repositories/${info.repositoryId}`, {
    enabled: pageType !== MainPageType.SHARED_WITH_ME,
  });
  const {
    mutate: shareRepositoryStatus,
    // isLoading: isRenaming,
  } = useShareRepositoryStatus(`/api/repositories/${info.repositoryId}`, {
    onSuccess: res => {
      // TODO: 토스트 추가
      console.log('공유 상태 변경 완료:', res);
      repositoryRefetch();
    },
    onError: err => {
      console.error('공유 상태 변경 실패:', err);
    },
    enabled: pageType !== MainPageType.SHARED_WITH_ME,
  });
  const {
    mutate: deleteRepository,
    // isLoading: isDeleting
  } = useDeleteRepository(`/api/repositories/${info.repositoryId}`, {
    onSuccess: () => {
      // TODO: 토스트 추가
      repositoryRefetch();
      console.log('삭제 성공');
    },
    onError: error => {
      console.error('삭제 실패', error);
    },
    enabled: pageType === MainPageType.PRIVATE_REPO,
  });
  const {
    mutate: repositoryExit,
    // isLoading: isExiting
  } = useRepositoryExit(`/api/repositories/${info.repositoryId}/exit`, {
    onSuccess: () => {
      console.log('나가기 성공');
      repositoryRefetch();
    },
    onError: error => {
      console.error('나가기 실패', error);
    },
    enabled: pageType === MainPageType.SHARED_WITH_ME,
  });
  const {
    data: entryCodeRes,
    isError: isEntryCodeError,
    error: entryCodeError,
  } = useGetRepositoryEntrycode(`/api/repositories/${info.repositoryId}/entrycode`, {
    enabled: pageType === MainPageType.SHARED_BY_ME,
  });

  useEffect(() => {
    if (isEntryCodeError) {
      console.error(entryCodeError); // TODO: 에러 처리 변경 필요
    }
  }, [isEntryCodeError, entryCodeError]);

  const handleMeatballClick = () => {
    if (meatballRef.current) {
      const rect = meatballRef.current.getBoundingClientRect();
      const browserHeight = (window.innerHeight / 2) | 0;
      let offset = 0;

      switch (pageType) {
        case MainPageType.PRIVATE_REPO:
          offset = -165;
          break;
        case MainPageType.SHARED_BY_ME:
          offset = -267;
          break;
        case MainPageType.SHARED_WITH_ME:
          offset = -172;
          break;
      }

      const setPotion =
        rect.bottom < browserHeight
          ? {
              bottom: offset,
              right: 0,
            }
          : {
              top: offset,
              right: 0,
            };

      setModalPosition(setPotion);
    }
    setIsModalOpen(prev => !prev);
  };

  const openChangeRepoName = () => {
    setIsModalsOpen(prev => ({ ...prev, changeRepoName: !isModlasOpen.changeRepoName }));
  };
  const openDeleteRepoAlert = () => {
    setIsModalsOpen(prev => ({ ...prev, deleteRepoAlert: !isModlasOpen.deleteRepoAlert }));
  };
  const openShareMyRepoAlertDialog = () => {
    setIsModalsOpen(prev => ({
      ...prev,
      shareMyRepoAlertDialog: !isModlasOpen.shareMyRepoAlertDialog,
    }));
  };
  const openCancelMyRepoShareAlertDialog = () => {
    setIsModalsOpen(prev => ({
      ...prev,
      cancelMyRepoShareAlert: !isModlasOpen.cancelMyRepoShareAlert,
    }));
  };
  const openLeaveSharedRepoAlertDialog = () => {
    setIsModalsOpen(prev => ({
      ...prev,
      leaveSharedRepoAlertDialog: !isModlasOpen.leaveSharedRepoAlertDialog,
    }));
  };
  const handleConfirmChangeRepoName = (newName: string) => {
    // TODO: 토스트 추가
    renameRepository(
      { repositoryName: newName },
      {
        onSuccess: () => {
          repositoryRefetch();
          console.log('레포 이름변경 성공');
        },
        onError: error => {
          console.error(error);
        },
      }
    );
  };
  const handleShareLinkCopy = () => {
    // TODO: 토스트 추가
    const successMessage = '공유 링크가 복사되었습니다!';
    const failMessage = '공유 링크 복사에 실패했습니다.';
    textCopy(info.shareLink, successMessage, failMessage);
  };
  const handleEntrycodeCopy = () => {
    // TODO: 토스트 추가
    if (!entryCodeRes?.data.entryCode) {
      alert('입장코드 복사에 실패했습니다.');
      return;
    }

    const successMessage = '입장코드가 복사되었습니다!';
    const failMessage = '입장코드 복사에 실패했습니다.';

    textCopy(entryCodeRes.data.entryCode, successMessage, failMessage);
  };

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
          <button
            className={styles.iconButton}
            ref={meatballRef}
            onClick={() => handleMeatballClick()}
          >
            <MeatballIcon />
          </button>
        </div>
      </div>
      {isModalOpen &&
        meatballRef.current &&
        (() => {
          switch (pageType) {
            case MainPageType.PRIVATE_REPO:
              return (
                <PrivateRepoMeatballModal
                  open={isModalOpen}
                  onOpenChange={setIsModalOpen}
                  position={modalPosition}
                  onShare={() => openShareMyRepoAlertDialog()}
                  onRename={() => openChangeRepoName()}
                  onDelete={() => openDeleteRepoAlert()}
                />
              );
            case MainPageType.SHARED_BY_ME:
              return (
                <SharedByMeRepoMeatballModal
                  open={isModalOpen}
                  onOpenChange={setIsModalOpen}
                  position={modalPosition}
                  shareLink={info.shareLink}
                  entryCode={entryCodeRes?.data.entryCode}
                  onRename={() => openChangeRepoName()}
                  onShareLinkCopy={() => handleShareLinkCopy()}
                  onEntryCodeCopy={() => handleEntrycodeCopy()}
                  onCancelShare={() => openCancelMyRepoShareAlertDialog()}
                />
              );
            case MainPageType.SHARED_WITH_ME:
              return (
                <SharedWithMeRepoMeatballModal
                  open={isModalOpen}
                  onOpenChange={setIsModalOpen}
                  position={modalPosition}
                  shareLink={info.shareLink}
                  onShareLinkCopy={() => handleShareLinkCopy()}
                  onLeaveRepository={() => openLeaveSharedRepoAlertDialog()}
                />
              );
          }
        })()}

      <ChangeRepoNameModal
        open={isModlasOpen.changeRepoName}
        onOpenChange={openChangeRepoName}
        currentName={info.repositoryName}
        onConfirm={handleConfirmChangeRepoName}
      />
      <DeleteRepoAlertDialog
        open={isModlasOpen.deleteRepoAlert}
        onOpenChange={openDeleteRepoAlert}
        onConfirm={deleteRepository}
      />
      <ShareMyRepoAlertDialog
        open={isModlasOpen.shareMyRepoAlertDialog}
        onOpenChange={openShareMyRepoAlertDialog}
        onConfirm={shareRepositoryStatus}
      />
      <CancelMyRepoShareAlertDialog
        open={isModlasOpen.cancelMyRepoShareAlert}
        onOpenChange={openCancelMyRepoShareAlertDialog}
        onConfirm={shareRepositoryStatus}
      />
      <LeaveSharedRepoAlertDialog
        open={isModlasOpen.leaveSharedRepoAlertDialog}
        onOpenChange={openLeaveSharedRepoAlertDialog}
        onConfirm={repositoryExit}
      />
    </div>
  );
};

export default RepoListItem;
