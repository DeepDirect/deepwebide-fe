import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { findIdSchema, type FindIdFormValues } from '@/schemas/auth.schema';
import Input from '@/components/atoms/Input/Input';
import Button from '@/components/atoms/Button/Button';
import FormField from '@/components/molecules/FormField/FormField';
import { useNavigate } from '@tanstack/react-router';
import styles from './FindIdForm.module.scss';

export default function FindIdForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FindIdFormValues>({
    resolver: zodResolver(findIdSchema),
    mode: 'onChange',
  });

  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);

  const navigate = useNavigate();

  const phone = watch('phoneNumber');
  const phoneCode = watch('phoneCode');

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

  const onSubmit = (data: FindIdFormValues) => {
    // TODO: 실제로 백엔드와 연동
    if (
      data.username === '구름' &&
      data.phoneNumber === '01012345678' &&
      data.phoneCode === '123456'
    ) {
      // 완료페이지로 email 전달하며 이동!
      navigate({
        to: '/find-id/complete',
        search: { email: 'goorm@email.com' },
      });
    } else {
      setFoundEmail('');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <FormField label="이름" htmlFor="username" required error={errors.username?.message}>
        <Input id="username" {...register('username')} placeholder="구름" />
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
        이메일 찾기
      </Button>

      {foundEmail === '' && (
        <div className={styles.error}>입력하신 정보로 가입된 이메일을 찾을 수 없습니다.</div>
      )}
    </form>
  );
}
