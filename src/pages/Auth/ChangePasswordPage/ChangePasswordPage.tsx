import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';

import Button from '@/components/atoms/Button/Button';
import PasswordInput from '@/components/atoms/Input/PasswordInput';
import FormField from '@/components/molecules/FormField/FormField';

import useChangePassword from '@/hooks/auth/useChangePassword';
import { useToast } from '@/hooks/common/useToast';

import { changePasswordSchema, type ChangePasswordFormValues } from '@/schemas/auth.schema';

import type { ChangePasswordURL } from '@/types/common/apiEndpoints.types';

import styles from './ChangePasswordPage.module.scss';

// URL 정의
const changePasswordURL: ChangePasswordURL = '/api/auth/password/reset';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [reauthToken, setReauthToken] = useState<string | null>(null);
  const toast = useToast();

  // localStorage에서 reauthToken 가져오기
  useEffect(() => {
    console.log('ChangePasswordPage 마운트됨');

    // localStorage 전체 내용 확인
    console.log('localStorage 전체 내용:', { ...localStorage });

    const token = localStorage.getItem('reauthToken');
    console.log('localStorage에서 가져온 reauthToken:', token ? '***' + token.slice(-4) : 'null');

    if (!token) {
      console.error('localStorage에 reauthToken이 없습니다!');

      toast.error('인증 토큰이 없습니다. 비밀번호 찾기부터 다시 시작해주세요.');
      navigate({ to: '/find-password' });
      return;
    }

    setReauthToken(token);
    console.log('reauthToken 상태 설정 완료');
  }, [navigate]);

  // 비밀번호 재설정 훅 사용
  const changePasswordMutation = useChangePassword(changePasswordURL, {
    onSuccess: () => {
      console.log('비밀번호 변경 성공');
      // 성공 시 localStorage에서 토큰 제거
      localStorage.removeItem('reauthToken');
      console.log('localStorage에서 reauthToken 제거 완료');

      toast.success('비밀번호가 성공적으로 변경되었습니다.');
      navigate({ to: '/sign-in' });
    },
    onError: () => {
      toast.error('비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
  });

  const newPassword = watch('newPassword');
  const passwordCheck = watch('passwordCheck');

  // 폼 제출
  const onSubmit = (data: ChangePasswordFormValues) => {
    console.log('비밀번호 변경 폼 제출');

    if (!reauthToken) {
      toast.error('인증 토큰이 없습니다. 처음부터 다시 시도해주세요.');
      return;
    }

    const resetPasswordData = {
      reauthToken,
      newPassword: data.newPassword,
      passwordCheck: data.passwordCheck,
    };

    console.log('비밀번호 재설정 요청 데이터:', {
      ...resetPasswordData,
      reauthToken: '***' + reauthToken.slice(-4), // 로그에서 토큰 마스킹
    });

    changePasswordMutation.mutate(resetPasswordData);
  };

  const isSubmitting = changePasswordMutation.isPending;
  const isButtonDisabled = isSubmitting || !newPassword || !passwordCheck;

  // 토큰이 아직 로드되지 않았으면 로딩 표시
  if (!reauthToken) {
    return (
      <div className={styles.inner}>
        <div>토큰을 확인하는 중...</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          개발자 도구 콘솔을 확인해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.inner}>
      <h1 className={styles.title}>새 비밀번호 설정</h1>
      <p className={styles.text}>새로운 비밀번호를 입력하고 계정을 보호하세요!</p>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <FormField
          label="새 비밀번호"
          htmlFor="newPassword"
          required
          error={errors.newPassword?.message}
        >
          <PasswordInput
            id="newPassword"
            {...register('newPassword')}
            placeholder="새 비밀번호를 입력하세요"
          />
        </FormField>

        <FormField
          label="비밀번호 확인"
          htmlFor="passwordCheck"
          required
          error={errors.passwordCheck?.message}
        >
          <PasswordInput
            id="passwordCheck"
            {...register('passwordCheck')}
            placeholder="비밀번호를 다시 입력하세요"
          />
        </FormField>

        <Button
          type="submit"
          className={styles.submitBtn}
          disabled={isButtonDisabled}
          variant={!isButtonDisabled ? 'active' : 'general'}
        >
          {isSubmitting ? '비밀번호 변경 중...' : '비밀번호 변경'}
        </Button>
      </form>
    </div>
  );
}
