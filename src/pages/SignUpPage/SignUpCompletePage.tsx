import { useNavigate } from '@tanstack/react-router';
import styles from './SignUpCompletePage.module.scss';
import Button from '@/components/atoms/Button/Button';

export default function SignUpCompletePage() {
  const navigate = useNavigate();

  return (
    <div className={styles.inner}>
      <h1 className={styles.title}>거의 다 왔어요!! 🙌</h1>
      <div className={styles.text}>
        <p>계정이 생성되었습니다!</p>
        <p>가입하신 이메일로 보내드린 링크를 통해 인증을 완료해 주세요.</p>
      </div>

      <Button
        className={styles.Button}
        variant="active"
        type="button"
        onClick={() => navigate({ to: '/sign-in' })}
      >
        로그인으로
      </Button>
    </div>
  );
}
