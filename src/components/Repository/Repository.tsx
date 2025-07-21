import 'dayjs/locale/ko';

import dayjs from 'dayjs';

import styles from './Repository.module.scss';

import HeartIcon from '@/assets/icons/heart.svg?react';
import FillHeartIcon from '@/assets/icons/fill-heart.svg?react';
import MeatballIcon from '@/assets/icons/meatball.svg?react';

import type { RepositoryItem } from '@/types/Repository';

type RepositoryProps = {
  info: RepositoryItem;
  onFavoriteClicked: (id: number) => void;
};

const Repository = ({ info, onFavoriteClicked }: RepositoryProps) => {
  return (
    <div className={styles.repositoryWrapper}>
      <div className={styles.nameWrapper}>
        <span>{info.repositoryName}</span>
      </div>

      <div className={styles.infoContainer}>
        <div className={styles.infoWrapper}>
          <span className={styles.updateTitle}>마지막 수정일: </span>
          <span className={styles.date}>
            {dayjs(info.updatedAt).locale('ko').format('YYYY-MM-DD')}
          </span>
        </div>

        <div className={styles.iconWrapper}>
          <button
            className={styles.iconButton}
            onClick={() => onFavoriteClicked(info.repositoryId)}
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

export default Repository;
