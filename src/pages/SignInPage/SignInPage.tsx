import PasswordInput from '@/components/atoms/Input/PasswordInput';
import styles from './SignInPage.module.scss';
import Input from '@/components/atoms/Input/Input';
import Button from '@/components/atoms/Button/Button';
import { Link } from '@tanstack/react-router';

export default function SignInPage() {
  return (
    <div className={styles.inner}>
      <h1 className={styles.title}>로그인</h1>
      <p className={styles.text}>이메일과 비밀번호를 입력하고 서비스를 이용하세요!</p>

      <div className={styles.formGroup}>
        <h3 className={styles.subTitle}>
          이메일<span className={styles.required}>*</span>
        </h3>
        <Input name="email" placeholder="user@goorm.com" />
      </div>
      <div className={styles.formGroup}>
        <h3 className={styles.subTitle}>
          비밀번호<span className={styles.required}>*</span>
        </h3>
        <PasswordInput name="password" placeholder="********" />
      </div>

      <div className={styles.options}>
        <label className={styles.checkbox}>
          <input type="checkbox" />
          <p>이메일 저장하기</p>
        </label>
      </div>

      <Button variant="active" className={styles.loginBtn}>
        로그인
      </Button>

      <div className={styles.links}>
        <Link to="/" className={styles.link}>
          아이디/비밀번호를 잊어버렸습니다..
        </Link>
        <Link to="/" className={`${styles.link} ${styles.linkWarning}`}>
          계정이 없습니다.. <span>회원가입 하러 가기</span>
        </Link>
      </div>
    </div>
  );
}
