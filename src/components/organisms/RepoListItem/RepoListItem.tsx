import 'dayjs/locale/ko';

import dayjs from 'dayjs';

import styles from './RepoListItem.module.scss';

import HeartIcon from '@/assets/icons/heart.svg?react';
import FillHeartIcon from '@/assets/icons/fill-heart.svg?react';
import MeatballIcon from '@/assets/icons/meatball.svg?react';

import type { RepositoryItem } from '@/types/Repository';

type RepositoryProps = {
  info: RepositoryItem;
  isSharedMe?: boolean;
  handleFavoriteClick: (id: number) => void;
  handleRepoClick: (id: number) => void;
};

const RepoListItem: React.FC<RepositoryProps> = ({
  info,
  isSharedMe,
  handleFavoriteClick,
  handleRepoClick,
}) => {
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
        {isSharedMe && (
          <div className={`${styles.infoWrapper} ${styles.ownerNameWrapper}`}>
            <span>{info.ownerName}</span>
          </div>
        )}
        <div className={`${styles.infoWrapper} ${styles.updateWrapper}`}>
          <span className={styles.updateTitle}>마지막 수정일: </span>
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
          <button className={styles.iconButton}>
            <MeatballIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepoListItem;
