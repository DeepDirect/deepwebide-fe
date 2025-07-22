import { Link, useSearch } from '@tanstack/react-router';
import { findIdCompleteRoute } from '@/router/routes/auth/find-id-complete';
import styles from './FindIdCompletePage.module.scss';
import Button from '@/components/atoms/Button/Button';

export default function FindIdCompletePage() {
  const { email } = useSearch({ from: findIdCompleteRoute.id });

  return (
    <div className={styles.inner}>
      <h1 className={styles.title}>당신의 이메일은!</h1>
      <div className={styles.email}>
        <span>{email}</span>
      </div>
      <Link to="/sign-in" style={{ width: '100%' }}>
        <Button
          className={styles.submitBtn}
          variant="active"
          type="button"
          style={{ width: '100%' }}
        >
          로그인으로
        </Button>
      </Link>
    </div>
  );
}
