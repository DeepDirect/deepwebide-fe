import GitHubIcon from '@/assets/icons/github.svg?react';

import { useToast } from '@/hooks/common/useToast';
import { useAuthStore } from '@/stores/authStore';

import styles from './GitHubLoginButton.module.scss';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI;
const GITHUB_LOGIN_URL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email`;

const GitHubLoginButton = () => {
  const toast = useToast();
  const { setAuthSocialLogin } = useAuthStore();

  const handleClickGithubLogin = () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      GITHUB_LOGIN_URL,
      'GithubLoginPopup',
      `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=yes,status=no`
    );

    if (!popup) {
      toast.error('팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.');
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const { type, response } = event.data;
      if (type === 'GITHUB_LOGIN_SUCCESS') {
        setAuthSocialLogin(response);
        popup?.close();

        window.removeEventListener('message', handleMessage);
      } else if (type === 'GITHUB_LOGIN_ERROR') {
        toast.error('GitHub 로그인에 실패했습니다.');
        popup?.close();
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);

    // 팝업이 닫혔는지 확인 (사용자가 직접 닫은 경우)
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      }
    }, 1000);
  };

  return (
    <button className={styles.socialButton} onClick={handleClickGithubLogin}>
      <div className={styles.socialLoginIcon}>
        <GitHubIcon className={styles.icon} />
      </div>
      GitHub으로 시작하기
    </button>
  );
};

export default GitHubLoginButton;
