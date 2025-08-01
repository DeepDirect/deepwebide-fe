import { useNavigate } from '@tanstack/react-router';
import styles from './UserProfile.module.scss';
import ProfileDropdown from '@/components/molecules/Modals/ProfileDropdown/ProfileDropdown';
import MessageTextIcon from '@/assets/icons/message-text.svg?react';
import moodHappyIcon from '@/assets/icons/mood-happy.svg';
import { useAuthStore } from '@/stores/authStore';

// 개별 훅 import
import useSignOut from '@/hooks/auth/useSignOut';
import type { SignOutURL } from '@/types/common/apiEndpoints.types';

// URL 정의
const signOutURL: SignOutURL = '/api/auth/signout';

interface UserProfileProps {
  variant?: 'lightModeOnly' | 'darkModeSupport';
  showChatButton?: boolean;
  onChatButtonClick?: () => void;
  isChatOpen?: boolean;
}

const UserProfile = ({
  variant = 'lightModeOnly',
  showChatButton = false,
  onChatButtonClick,
  isChatOpen = false,
}: UserProfileProps) => {
  const navigate = useNavigate();
  const { getUserInfo } = useAuthStore(); // 상태만 조회

  // 개별 훅 사용
  const signOutMutation = useSignOut(signOutURL);

  // 실제 사용자 정보 가져오기
  const userInfo = getUserInfo();

  const handleLogout = async () => {
    try {
      signOutMutation.mutate(undefined, {
        onSuccess: () => {
          navigate({ to: '/sign-in' });
        },
        onError: error => {
          console.error('로그아웃 처리 중 오류:', error);
          navigate({ to: '/sign-in' }); // 에러여도 로그인 페이지로
        },
      });
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      navigate({ to: '/sign-in' });
    }
  };

  // 닉네임과 프로필 이미지 처리
  const displayNickname = userInfo?.nickname || '사용자';
  const profileImageUrl = userInfo?.profileImageUrl || moodHappyIcon;

  return (
    <div className={styles.profileArea}>
      {showChatButton && (
        <button
          className={`${styles.chatButton} ${isChatOpen ? styles.active : ''}`}
          onClick={onChatButtonClick}
        >
          <MessageTextIcon className={styles.chatIcon} />
        </button>
      )}

      <ProfileDropdown onLogout={handleLogout}>
        <button
          className={`${styles.profileButton} ${variant === 'darkModeSupport' ? styles.darkModeSupport : styles.lightModeOnly}`}
        >
          {displayNickname}
          <span className={styles.avatar}>
            <img
              src={profileImageUrl}
              alt="프로필 아이콘"
              width={18}
              height={18}
              onError={e => {
                // 프로필 이미지 로드 실패 시 기본 이미지로 대체
                const target = e.target as HTMLImageElement;
                target.src = moodHappyIcon;
              }}
            />
          </span>
        </button>
      </ProfileDropdown>
    </div>
  );
};

export default UserProfile;
