import { useNavigate } from '@tanstack/react-router';
import styles from './UserProfile.module.scss';
import ProfileDropdown from '@/components/molecules/Modals/ProfileDropdown/ProfileDropdown';
import MessageTextIcon from '@/assets/icons/message-text.svg?react';
import moodHappyIcon from '@/assets/icons/mood-happy.svg';
import { useAuthStore } from '@/stores/authStore';

interface UserProfileProps {
  variant?: 'lightModeOnly' | 'darkModeSupport';
  showChatButton?: boolean;
  onChatButtonClick?: () => void;
}

const UserProfile = ({
  variant = 'lightModeOnly',
  showChatButton = false,
  onChatButtonClick,
}: UserProfileProps) => {
  const navigate = useNavigate();
  const { signout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signout();
      navigate({ to: '/sign-in' });
    } catch (error) {
      // 에러 처리 로직 필요
      console.error('로그아웃 처리 중 오류:', error);
      navigate({ to: '/sign-in' });
    }
  };

  return (
    <div className={styles.profileArea}>
      {showChatButton && (
        <button className={styles.chatButton} onClick={onChatButtonClick}>
          <MessageTextIcon className={styles.chatIcon} />
        </button>
      )}

      <ProfileDropdown onLogout={handleLogout}>
        <button
          className={`${styles.profileButton} ${variant === 'darkModeSupport' ? styles.darkModeSupport : styles.lightModeOnly}`}
        >
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
