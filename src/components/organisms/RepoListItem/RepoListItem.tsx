import 'dayjs/locale/ko';

import { useRef, useState } from 'react';
import dayjs from 'dayjs';

import FillHeartIcon from '@/assets/icons/fill-heart.svg?react';
import HeartIcon from '@/assets/icons/heart.svg?react';
import MeatballIcon from '@/assets/icons/meatball.svg?react';

import MainPageType from '@/constants/enums/MainPageType.enum';

import useDeleteRepository from '@/hooks/useDeleteRepository';
import useRepositoryRename from '@/hooks/useRepositoryRename';

import ChangeRepoNameModal from '@/features/Modals/ChangeRepoNameModal/ChangeRepoNameModal';
import PrivateRepoMeatballModal from '@/features/Modals/PrivateRepoMeatballModal/PrivateRepoMeatballModal';
import SharedByMeRepoMeatballModal from '@/features/Modals/SharedByMeRepoMeatballModal/SharedByMeRepoMeatballModal';
import SharedWithMeRepoMeatballModal from '@/features/Modals/SharedWithMeRepoMeatballModal/SharedWithMeRepoMeatballModal';
import DeleteRepoAlertDialog from '@/features/AlertDialog/common/DeleteRepoAlertDialog';

import type { RepositoryItem } from '@/schemas/main.schema';

import styles from './RepoListItem.module.scss';

type RepositoryProps = {
  info: RepositoryItem;
  pageType: MainPageType;
  handleFavoriteClick: (id: number) => void;
  handleRepoClick: (id: number) => void;
};

type positionType = {
  top?: number;
  bottom?: number;
  right?: number;
  left?: number;
};

const RepoListItem: React.FC<RepositoryProps> = ({
  info,
  handleFavoriteClick,
  handleRepoClick,
  pageType,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState<positionType>({});
  const meatballRef = useRef<HTMLButtonElement>(null);
  const [isModlasOpen, setIsModalsOpen] = useState({
    changeRepoName: false,
    deleteRepoAlert: false,
  });
  const {
    mutate: renameRepository,
    // isLoading: isRenaming,
  } = useRepositoryRename(`/api/repositories/${info.repositoryId}`);

  const deleteRepositoryMutation = useDeleteRepository(`/api/repositories/${info.repositoryId}`, {
    onSuccess: () => {
      console.log('삭제 성공');
    },
    onError: error => {
      console.error('삭제 실패', error);
    },
  });

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

  const handleConfirmChangeRepoName = (newName: string) => {
    renameRepository(
      { repositoryName: newName },
      {
        onSuccess: () => {
          console.log('레포 삭제 성공');
        },
        onError: error => {
          console.error(error);
        },
      }
    );
  };

  const handleDeleteRepo = () => {
    deleteRepositoryMutation.mutate();
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
                  shareLink={info.shareLink ?? ''}
                  entryCode={''} // TODO: entryCode는 API 연동 후 추가
                  onRename={() => openChangeRepoName()}
                  onShareLinkCopy={() => console.log('링크 복사됨')}
                  onEntryCodeCopy={() => console.log('코드 복사됨')}
                  onCancelShare={() => console.log('공유 취소')}
                />
              );
            case MainPageType.SHARED_WITH_ME:
              return (
                <SharedWithMeRepoMeatballModal
                  open={isModalOpen}
                  onOpenChange={setIsModalOpen}
                  position={modalPosition}
                  shareLink={info.shareLink ?? ''}
                  onShareLinkCopy={() => console.log('링크 복사됨')}
                  onLeaveRepository={() => console.log('레포 떠남')}
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
        onConfirm={handleDeleteRepo}
      />
    </div>
  );
};

export default RepoListItem;
