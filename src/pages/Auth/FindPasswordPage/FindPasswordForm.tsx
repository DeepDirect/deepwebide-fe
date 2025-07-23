import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from '@tanstack/react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { findPasswordSchema, type FindPasswordFormValues } from '@/schemas/auth.schema';
import Input from '@/components/atoms/Input/Input';
import Button from '@/components/atoms/Button/Button';
import FormField from '@/components/molecules/FormField/FormField';
import styles from './FindPasswordPage.module.scss';

export default function FindPasswordForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FindPasswordFormValues>({
    resolver: zodResolver(findPasswordSchema),
    mode: 'onChange',
  });

  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [found, setFound] = useState<boolean | null>(null);

  const phone = watch('phoneNumber');
  const phoneCode = watch('phoneCode');

  // 인증번호 타이머
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

  const handleSendCode = () => {
    setCodeSent(true);
    startTimer();
    // TODO: 실제 API 연동
  };

  const handleVerifyCode = () => {
    setCodeVerified(true);
    // TODO: 실제 API 연동
  };

  const navigate = useNavigate();

  const onSubmit = (data: FindPasswordFormValues) => {
    // TODO: 실제로 백엔드와 연동
    if (
      data.username === '구름' &&
      data.email === 'goorm@email.com' &&
      data.phoneNumber === '01012345678' &&
      data.phoneCode === '123456'
    ) {
      navigate({
        to: '/find-password/change',
        search: { email: data.email },
      });
    } else {
      setFound(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <FormField label="이름" htmlFor="username" required error={errors.username?.message}>
        <Input id="username" {...register('username')} placeholder="구름" />
      </FormField>

      <FormField label="이메일" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" {...register('email')} placeholder="goorm@email.com" />
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
            type="button"
            onClick={handleSendCode}
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
            type="button"
            onClick={handleVerifyCode}
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
        disabled={isSubmitting || !codeVerified}
        variant={codeVerified ? 'active' : 'general'}
      >
        비밀번호 찾기
      </Button>

      {found === false && (
        <div className={styles.error}>입력하신 정보로 가입된 계정을 찾을 수 없습니다.</div>
      )}
    </form>
  );
}
