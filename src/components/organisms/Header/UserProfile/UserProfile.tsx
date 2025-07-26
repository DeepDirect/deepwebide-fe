import { useNavigate } from '@tanstack/react-router';
import styles from './UserProfile.module.scss';
import ProfileDropdown from '@/components/molecules/Modals/ProfileDropdown/ProfileDropdown';
import MessageTextIcon from '@/assets/icons/message-text.svg?react';
import moodHappyIcon from '@/assets/icons/mood-happy.svg';

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

  const handleLogout = () => {
    // TODO: 로그아웃 처리 로직 구현
    console.log('로그아웃 처리');
    // signout(); // authStore 사용 시 주석 해제
    navigate({ to: '/sign-in' });
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
