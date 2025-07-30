import SignInForm from '@/features/Auth/SignInForm/SignInForm';
import { Link } from '@tanstack/react-router';
import styles from './SignInPage.module.scss';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI;
const GITHUB_LOGIN_URL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email`;

export default function SignInPage() {
  const navigate = useNavigate();
  const { setAuthSocialLogin, isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (isLoggedIn) navigate({ to: '/main' });
  }, [isLoggedIn]);

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
      alert('팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.');
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'http://localhost:8080') return;

      const { type, response } = event.data;
      if (type === 'GITHUB_LOGIN_SUCCESS') {
        setAuthSocialLogin(response);
        popup?.close();

        window.removeEventListener('message', handleMessage);
      } else if (type === 'GITHUB_LOGIN_ERROR') {
        alert('GitHub 로그인에 실패했습니다.');
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
    <div className={styles.inner}>
      <h1 className={styles.title}>로그인</h1>
      <p className={styles.text}>이메일과 비밀번호를 입력하고 서비스를 이용하세요!</p>

      <SignInForm />

      <button className={styles.socialButton} onClick={handleClickGithubLogin}>
        <div className={styles.socialLoginIcon}>
          <svg
            fill="white"
            role="img"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </div>
        GitHub으로 시작하기
      </button>

      <div className={styles.links}>
        <Link to="/find-id" className={styles.link}>
          아이디/비밀번호를 잊어버렸습니다..
        </Link>
        <Link to="/sign-up" className={`${styles.link} ${styles.linkWarning}`}>
          계정이 없습니다.. <span>회원가입 하러 가기</span>
        </Link>
      </div>
    </div>
  );
}
