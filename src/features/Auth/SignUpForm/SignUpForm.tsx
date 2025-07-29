import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema } from '@/schemas/auth.schema';
import type { SignUpFormValues } from '@/schemas/auth.schema';

import Input from '@/components/atoms/Input/Input';
import PasswordInput from '@/components/atoms/Input/PasswordInput';
import Button from '@/components/atoms/Button/Button';
import FormField from '@/components/molecules/FormField/FormField';

// 훅들과 URL 타입들 import
import {
  useSignUp,
  useCheckEmail,
  useSendPhoneCode,
  useVerifyPhoneCode,
} from '@/hooks/auth/useSignUp';
import type {
  SignUpURL,
  EmailCheckURL,
  PhoneSendCodeURL,
  PhoneVerifyCodeURL,
} from '@/types/common/apiEndpoints.types';

import styles from './SignUpForm.module.scss';

// URL들 정의
const signUpURL: SignUpURL = '/api/auth/signup';
const emailCheckURL: EmailCheckURL = '/api/auth/email/check';
const phoneSendCodeURL: PhoneSendCodeURL = '/api/auth/phone/send-code';
const phoneVerifyCodeURL: PhoneVerifyCodeURL = '/api/auth/phone/verify-code';

export default function SignUpForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
  });

  // 상태 관리
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [timer, setTimer] = useState(0);

  // 폼 데이터 감시
  const email = watch('email');
  const username = watch('username');
  const phone = watch('phoneNumber');
  const phoneCode = watch('phoneCode');

  // URL을 파라미터로 전달하는 훅들 사용
  const signUpMutation = useSignUp(signUpURL, {
    onError: () => {
      alert('회원가입에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const checkEmailMutation = useCheckEmail(emailCheckURL, {
    onSuccess: data => {
      if (data.data.isAvailable) {
        setEmailVerified(true);
        alert('사용 가능한 이메일입니다.');
      } else {
        alert('이미 사용 중인 이메일입니다.');
      }
    },
    onError: () => {
      alert('이메일 중복 확인에 실패했습니다.');
    },
  });

  const sendPhoneCodeMutation = useSendPhoneCode(phoneSendCodeURL, {
    onSuccess: () => {
      setCodeSent(true);
      startTimer();
      alert('인증번호가 발송되었습니다.');
    },
    onError: error => {
      console.error('인증번호 발송 실패:', error);
      alert(`인증번호 발송에 실패했습니다. (${error.response?.status || '알 수 없는 오류'})`);
    },
  });

  const verifyPhoneCodeMutation = useVerifyPhoneCode(phoneVerifyCodeURL, {
    onSuccess: data => {
      if (data.data.verified) {
        setCodeVerified(true);
        alert('휴대폰 인증이 완료되었습니다.');
      } else {
        alert('인증번호가 올바르지 않습니다.');
      }
    },
    onError: () => {
      alert('인증번호 확인에 실패했습니다.');
    },
  });

  // 타이머 로직
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

  // 이메일 중복 확인
  const handleCheckEmail = () => {
    if (!email) {
      alert('이메일을 입력해주세요.');
      return;
    }

    checkEmailMutation.mutate({ email: email.trim() });
  };

  // 인증번호 발송
  const handleSendPhoneCode = () => {
    if (!phone || !username) {
      alert('이름과 휴대폰 번호를 입력해주세요.');
      return;
    }

    const cleanPhoneNumber = phone.replace(/-/g, '');
    const requestData = {
      phoneNumber: cleanPhoneNumber,
      username: username.trim(),
    };

    sendPhoneCodeMutation.mutate(requestData);
  };

  // 인증번호 확인
  const handleVerifyPhoneCode = () => {
    if (!phoneCode || !phone) {
      alert('인증번호를 입력해주세요.');
      return;
    }

    const cleanPhoneNumber = phone.replace(/-/g, '');
    const requestData = {
      phoneNumber: cleanPhoneNumber,
      phoneCode: phoneCode.trim(),
    };

    verifyPhoneCodeMutation.mutate(requestData);
  };

  // 폼 제출
  const onSubmit = (data: SignUpFormValues) => {
    if (!emailVerified) {
      alert('이메일 중복 확인을 완료해주세요.');
      return;
    }

    if (!codeVerified) {
      alert('휴대폰 인증을 완료해주세요.');
      return;
    }

    const signUpData = {
      ...data,
      phoneNumber: data.phoneNumber.replace(/-/g, ''), // 하이픈 제거
    };

    signUpMutation.mutate(signUpData);
  };

  const isSubmitting = signUpMutation.isPending;
  const isButtonDisabled = isSubmitting || !emailVerified || !codeVerified;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <FormField label="이메일" htmlFor="email" required error={errors.email?.message}>
        <div className={styles.fieldWithButton}>
          <Input id="email" {...register('email')} placeholder="user@goorm.com" />
          <Button
            type="button"
            onClick={handleCheckEmail}
            disabled={!email || emailVerified || checkEmailMutation.isPending}
            variant={emailVerified ? 'inactive' : 'active'}
          >
            {checkEmailMutation.isPending
              ? '확인 중...'
              : emailVerified
                ? '중복 확인 완료'
                : '중복 확인'}
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
            type="button"
            onClick={handleSendPhoneCode}
            disabled={!phone || !username || timer > 0 || sendPhoneCodeMutation.isPending}
            variant={codeSent ? 'inactive' : 'active'}
          >
            {sendPhoneCodeMutation.isPending
              ? '발송 중...'
              : timer > 0
                ? `0:${timer}`
                : '인증번호 발송'}
          </Button>
        </div>
      </FormField>

      <FormField label="인증번호" htmlFor="phoneCode" required error={errors.phoneCode?.message}>
        <div className={styles.fieldWithButton}>
          <Input id="phoneCode" {...register('phoneCode')} placeholder="123456" />
          <Button
            type="button"
            onClick={handleVerifyPhoneCode}
            disabled={!phoneCode || codeVerified || verifyPhoneCodeMutation.isPending}
            variant={codeVerified ? 'inactive' : 'active'}
          >
            {verifyPhoneCodeMutation.isPending
              ? '확인 중...'
              : codeVerified
                ? '인증 완료'
                : '인증하기'}
          </Button>
        </div>
      </FormField>

      <Button
        type="submit"
        className={styles.submitBtn}
        disabled={isButtonDisabled}
        variant={emailVerified && codeVerified ? 'active' : 'general'}
      >
        {isSubmitting ? '회원가입 중...' : '회원가입'}
      </Button>
    </form>
  );
}
