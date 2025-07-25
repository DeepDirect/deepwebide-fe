import styles from './HeaderVariant.module.scss';
import ProfileDropdown from '@/components/molecules/Modals/ProfileDropdown/ProfileDropdown';
import moodHappyIcon from '@/assets/icons/mood-happy.svg';
import { useAuthStore } from '@/stores/authStore';

const UserProfile = () => {
  const { signout } = useAuthStore();

  const handleLogout = () => {
    // TODO: 로그아웃 처리 로직 구현
    console.log('로그아웃 처리');
    signout();
  };

  return (
    <div className={styles.profileArea}>
      <ProfileDropdown onLogout={handleLogout}>
        <button className={styles.profileButton}>
          슬기로운 개발자
          <span className={styles.avatar}>
            <img src={moodHappyIcon} alt="프로필 아이콘" width={18} height={18} />
          </span>
        </button>
      </ProfileDropdown>
    </div>
  );
};

export default UserProfile;
