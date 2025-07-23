import FindPasswordForm from '@/features/Auth/FindPasswordForm/FindPasswordForm';
import { Link } from '@tanstack/react-router';
import styles from './FindPasswordPage.module.scss';

export default function FindPasswordPage() {
  return (
    <div className={styles.inner}>
      <h1 className={styles.title}>비밀번호를 잊어버리셨습니까?</h1>
      <p className={styles.text}>
        가입한 이름과 이메일, 전화번호 정보를 입력하고, 새로운 비밀번호로 변경하세요!
      </p>

      <FindPasswordForm />

      <div className={styles.links}>
        <Link to="/find-id" className={styles.link}>
          이메일이 기억이 나지 않습니다..
        </Link>
        <Link to="/sign-in" className={`${styles.link} ${styles.linkWarning}`}>
          <span>비밀번호가 기억 나는거 같아요!</span>
        </Link>
      </div>
    </div>
  );
}
