import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema } from '@/schemas/auth.schema';
import type { SignUpFormValues } from '@/schemas/auth.schema';
import Input from '@/components/atoms/Input/Input';
import PasswordInput from '@/components/atoms/Input/PasswordInput';
import Button from '@/components/atoms/Button/Button';
import FormField from '@/components/molecules/FormField';
import styles from './SignUpPage.module.scss';

export default function SignUpForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
  });

  // 상태 관리
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [timer, setTimer] = useState(0);

  const email = watch('email');
  const phone = watch('phoneNumber');
  const phoneCode = watch('phoneCode');

  // 타이머 로직 (간단한 60초 예시)
  const startTimer = () => {
    setTimer(59);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onSubmit = (data: SignUpFormValues) => {
    console.log('회원가입 요청', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <FormField label="이메일" htmlFor="email" required error={errors.email?.message}>
        <div className={styles.fieldWithButton}>
          <Input id="email" {...register('email')} placeholder="user@goorm.com" />
          <Button
            onClick={() => setEmailVerified(true)}
            disabled={!email || emailVerified}
            variant={emailVerified ? 'inactive' : 'active'}
          >
            {emailVerified ? '인증 완료' : '이메일 확인'}
          </Button>
        </div>
      </FormField>

      <FormField label="이름" htmlFor="username" required error={errors.username?.message}>
        <Input id="username" {...register('username')} placeholder="구름" />
      </FormField>

      <FormField label="비밀번호" htmlFor="password" required error={errors.password?.message}>
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

      <FormField
        label="휴대폰 번호"
        htmlFor="phoneNumber"
        required
        error={errors.phoneNumber?.message}
      >
        <div className={styles.fieldWithButton}>
          <Input id="phoneNumber" {...register('phoneNumber')} placeholder="01012345678" />
          <Button
            onClick={() => {
              setCodeSent(true);
              startTimer();
            }}
            disabled={!phone || timer > 0}
            variant={codeSent ? 'inactive' : 'active'}
          >
            {timer > 0 ? `0:${timer}` : '인증번호 발송'}
          </Button>
        </div>
      </FormField>

      <FormField label="인증번호" htmlFor="phoneCode" required error={errors.phoneCode?.message}>
        <div className={styles.fieldWithButton}>
          <Input id="phoneCode" {...register('phoneCode')} placeholder="123456" />
          <Button
            onClick={() => setCodeVerified(true)}
            disabled={!phoneCode || codeVerified}
            variant={codeVerified ? 'inactive' : 'active'}
          >
            {codeVerified ? '인증 완료' : '인증하기'}
          </Button>
        </div>
      </FormField>

      <Button
        type="submit"
        className={styles.submitBtn}
        disabled={isSubmitting || !emailVerified || !codeVerified}
        variant={emailVerified && codeVerified ? 'active' : 'general'}
      >
        회원가입
      </Button>
    </form>
  );
}
