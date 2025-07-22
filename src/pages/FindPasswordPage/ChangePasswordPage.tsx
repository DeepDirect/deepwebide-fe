import { useSearch } from '@tanstack/react-router';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/schemas/auth.schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordRoute } from '@/router/routes/auth/find-password-change';
import PasswordInput from '@/components/atoms/Input/PasswordInput';
import Button from '@/components/atoms/Button/Button';
import FormField from '@/components/molecules/FormField';
import styles from './ChangePasswordPage.module.scss';

export default function ChangePasswordPage() {
  const { email } = useSearch({ from: changePasswordRoute.id });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
  });

  // 두 값이 모두 비어 있지 않고 에러가 없어야 활성화
  const password = watch('password');
  const passwordCheck = watch('passwordCheck');

  const isButtonDisabled =
    isSubmitting || !password || !passwordCheck || !!errors.password || !!errors.passwordCheck;

  const onSubmit = async (data: ChangePasswordFormValues) => {
    // 실제로 백엔드에 email과 새 password 전달!
    console.log('변경할 데이터:', { email, ...data });
    alert('비밀번호 변경에 성공했습니다.');
    // 로그인 페이지로 이동 등
  };

  return (
    <div className={styles.inner}>
      <h1 className={styles.title}>새로운 비밀번호를 설정해 주세요</h1>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <FormField label="새 비밀번호" htmlFor="password" required error={errors.password?.message}>
          <PasswordInput id="password" {...register('password')} placeholder="********" />
        </FormField>
        <FormField
          label="비밀번호 확인"
          htmlFor="passwordCheck"
          required
          error={errors.passwordCheck?.message}
        >
          <PasswordInput id="passwordCheck" {...register('passwordCheck')} placeholder="********" />
        </FormField>
        <Button
          type="submit"
          className={styles.submitBtn}
          disabled={isButtonDisabled}
          variant={!isButtonDisabled ? 'active' : 'general'}
        >
          새 비밀번호로 변경하기
        </Button>
      </form>
    </div>
  );
}
