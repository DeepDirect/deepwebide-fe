import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema } from '@/schemas/auth.schema';
import type { SignInFormValues } from '@/schemas/auth.schema';
import Input from '@/components/atoms/Input/Input';
import PasswordInput from '@/components/atoms/Input/PasswordInput';
import Button from '@/components/atoms/Button/Button';
import FormField from '@/components/molecules/FormField/FormField';
import styles from './SignInForm.module.scss';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';

export default function SignInForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
  });
  const navigate = useNavigate();
  const { signin } = useAuthStore();

  const email = watch('email');
  const password = watch('password');

  const onSubmit = (data: SignInFormValues) => {
    // TODO: 로그인 API 호출
    console.log('로그인 시도:', data);

    signin();
    navigate({ to: '/main' });
  };

  const isButtonDisabled = isSubmitting || !email || !password;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <FormField label="이메일" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" placeholder="user@goorm.com" {...register('email')} />
      </FormField>

      <FormField label="비밀번호" htmlFor="password" required error={errors.password?.message}>
        <PasswordInput id="password" placeholder="********" {...register('password')} />
      </FormField>

      <div className={styles.options}>
        <label className={styles.checkbox}>
          <input type="checkbox" />
          <p>이메일 저장하기</p>
        </label>
      </div>

      <Button
        variant={isButtonDisabled ? 'general' : 'active'}
        className={styles.loginBtn}
        type="submit"
        disabled={isButtonDisabled}
      >
        로그인
      </Button>
    </form>
  );
}
