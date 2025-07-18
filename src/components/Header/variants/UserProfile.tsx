import styles from './HeaderVariant.module.scss';
import moodHappyIcon from '@/assets/icons/mood-happy.svg';

const UserProfile = () => {
  return (
    <div className={styles.profileArea}>
      <button className={styles.profileButton}>
        슬기로운 개발자
        <span className={styles.avatar}>
          <img src={moodHappyIcon} alt="프로필 아이콘" width={18} height={18} />
        </span>
      </button>
    </div>
  );
};

export default UserProfile;
