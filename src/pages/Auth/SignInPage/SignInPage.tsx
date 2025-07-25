import SignInForm from '@/features/Auth/SignInForm/SignInForm';
import { Link } from '@tanstack/react-router';
import styles from './SignInPage.module.scss';

export default function SignInPage() {
  return (
    <div className={styles.inner}>
      <h1 className={styles.title}>로그인</h1>
      <p className={styles.text}>이메일과 비밀번호를 입력하고 서비스를 이용하세요!</p>

      <SignInForm />

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
