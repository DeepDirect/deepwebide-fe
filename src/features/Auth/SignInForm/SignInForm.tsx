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
import { useEffect } from 'react';
import { useToast } from '@/hooks/common/useToast';

// 훅과 URL 타입 import
import useSignIn from '@/hooks/auth/useSignIn';
import type { SignInURL } from '@/types/common/apiEndpoints.types';

// URL 정의
const signInURL: SignInURL = '/api/auth/signin';

export default function SignInForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
  });

  const navigate = useNavigate();
  const toast = useToast();
  const { isLoggedIn } = useAuthStore();

  // URL을 파라미터로 전달
  const signInMutation = useSignIn(signInURL, {
    onError: error => {
      const message = error.response?.message // error.response 형태는 {status, message, data} 형태임
        ? error.response?.message
        : '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
      toast.error(message);
    },
  });

  const email = watch('email');
  const password = watch('password');

  const onSubmit = async (data: SignInFormValues) => {
    signInMutation.mutate(data);
  };

  useEffect(() => {
    if (isLoggedIn) navigate({ to: '/main' });
  }, [isLoggedIn, navigate]);

  const isButtonDisabled = signInMutation.isPending || !email || !password;

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
        {signInMutation.isPending ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
