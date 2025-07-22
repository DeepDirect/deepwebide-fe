import { useSearch, useNavigate } from '@tanstack/react-router';
import { findIdCompleteRoute } from '@/router/routes/auth/find-id-complete';
import styles from './FindIdCompletePage.module.scss';
import Button from '@/components/atoms/Button/Button';

export default function FindIdCompletePage() {
  const { email } = useSearch({ from: findIdCompleteRoute.id });
  const navigate = useNavigate();

  return (
    <div className={styles.inner}>
      <h1 className={styles.title}>당신의 이메일은!</h1>
      <div className={styles.email}>
        <span>{email}</span>
      </div>
      <Button
        className={styles.submitBtn}
        variant="active"
        type="button"
        onClick={() => navigate({ to: '/sign-in' })}
      >
        로그인으로
      </Button>
    </div>
  );
}
