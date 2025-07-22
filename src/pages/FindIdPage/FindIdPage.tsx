import FindIdForm from './FindIdForm';
import { Link } from '@tanstack/react-router';
import styles from './FindIdPage.module.scss';

export default function FindIdPage() {
  return (
    <div className={styles.inner}>
      <h1 className={styles.title}>이메일을 잊어버리셨습니까?</h1>
      <p className={styles.text}>가입한 이름과 전화번호 정보를 입력하고, 이메일을 찾아가세요!</p>
      <FindIdForm />

      <div className={styles.links}>
        <Link to="/" className={styles.link}>
          비밀번호가 기억이 나지 않습니다..
        </Link>
        <Link to="/sign-in" className={`${styles.link} ${styles.linkWarning}`}>
          <span>아이디가 기억 나는거 같아요!</span>
        </Link>
      </div>
    </div>
  );
}
