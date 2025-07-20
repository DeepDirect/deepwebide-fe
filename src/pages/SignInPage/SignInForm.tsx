import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema } from '@/schemas/auth.schema';
import type { SignInFormValues } from '@/schemas/auth.schema';
import Input from '@/components/atoms/Input/Input';
import PasswordInput from '@/components/atoms/Input/PasswordInput';
import Button from '@/components/atoms/Button/Button';
import styles from './SignInPage.module.scss';

export default function SignInForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = (data: SignInFormValues) => {
    console.log('로그인 요청', data);
    // 추후 api 연동 예정
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.formGroup}>
        <h3 className={styles.subTitle}>
          이메일<span className={styles.required}>*</span>
        </h3>
        <Input type="email" placeholder="user@goorm.com" {...register('email')} />
        {errors.email && <p className={styles.error}>{errors.email.message}</p>}
      </div>
      <div className={styles.formGroup}>
        <h3 className={styles.subTitle}>
          비밀번호<span className={styles.required}>*</span>
        </h3>
        <PasswordInput placeholder="********" {...register('password')} />
        {errors.password && <p className={styles.error}>{errors.password.message}</p>}
      </div>

      <div className={styles.options}>
        <label className={styles.checkbox}>
          <input type="checkbox" />
          <p>이메일 저장하기</p>
        </label>
      </div>

      <Button variant="active" className={styles.loginBtn} type="submit" disabled={isSubmitting}>
        로그인
      </Button>
    </form>
  );
}
