import styles from './Repository.module.scss';

import HeartIcon from '@/assets/icons/heart.svg?react';
import FillHeartIcon from '@/assets/icons/fill-heart.svg?react';
import MeatballIcon from '@/assets/icons/meatball.svg?react';

const Repository = () => {
  const isFavorite = true; // TODO: 좋아요 상태에 따라 변경

  return (
    <div className={styles.repositoryWrapper}>
      <div className={styles.nameWrapper}>
        <span>My Repository</span>
      </div>

      <div className={styles.infoContainer}>
        <div className={styles.infoWrapper}>
          <span>마지막 수정일: </span>
          <span className={styles.date}>2023.10.01</span>
        </div>

        <div className={styles.iconWrapper}>
          <button className={styles.iconButton}>
            {isFavorite ? <FillHeartIcon className={styles.checked} /> : <HeartIcon />}
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
