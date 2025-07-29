import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { findIdSchema } from '@/schemas/auth.schema';
import type { FindIdFormValues } from '@/schemas/auth.schema';

import Input from '@/components/atoms/Input/Input';
import Button from '@/components/atoms/Button/Button';
import FormField from '@/components/molecules/FormField/FormField';

// 훅들과 URL 타입들 import
import {
  useFindId,
  useSendPhoneCodeForFindId,
  useVerifyPhoneCodeForFindId,
} from '@/hooks/auth/useFindId';
import type {
  FindIdURL,
  PhoneSendCodeURL,
  PhoneVerifyCodeURL,
} from '@/types/common/apiEndpoints.types';

import styles from './FindIdForm.module.scss';

// URL들 정의
const findIdURL: FindIdURL = '/api/auth/email/find';
const phoneSendCodeURL: PhoneSendCodeURL = '/api/auth/phone/send-code';
const phoneVerifyCodeURL: PhoneVerifyCodeURL = '/api/auth/phone/verify-code';

export default function FindIdForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FindIdFormValues>({
    resolver: zodResolver(findIdSchema),
    mode: 'onChange',
  });

  // 상태 관리
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [timer, setTimer] = useState(0);

  // 폼 데이터 감시
  const username = watch('username');
  const phone = watch('phoneNumber');
  const phoneCode = watch('phoneCode');

  // URL을 파라미터로 전달하는 훅들 사용
  const findIdMutation = useFindId(findIdURL, {
    onError: () => {
      alert('일치하는 계정을 찾을 수 없습니다.');
    },
  });

  const sendPhoneCodeMutation = useSendPhoneCodeForFindId(phoneSendCodeURL, {
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

  const verifyPhoneCodeMutation = useVerifyPhoneCodeForFindId(phoneVerifyCodeURL, {
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

    console.log('아이디 찾기 - 인증번호 발송 요청 데이터:', requestData);
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

    console.log('아이디 찾기 - 인증번호 확인 요청 데이터:', requestData);
    verifyPhoneCodeMutation.mutate(requestData);
  };

  // 폼 제출
  const onSubmit = (data: FindIdFormValues) => {
    if (!codeVerified) {
      alert('휴대폰 인증을 완료해주세요.');
      return;
    }

    const findIdData = {
      username: data.username,
      phoneNumber: data.phoneNumber.replace(/-/g, ''), // 하이픈 제거
      phoneCode: data.phoneCode,
    };

    console.log('아이디 찾기 요청 데이터:', findIdData);
    findIdMutation.mutate(findIdData);
  };

  const isSubmitting = findIdMutation.isPending;
  const isButtonDisabled = isSubmitting || !codeVerified;

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
        variant={codeVerified ? 'active' : 'general'}
      >
        {isSubmitting ? '아이디 찾는 중...' : '아이디 찾기'}
      </Button>
    </form>
  );
}
