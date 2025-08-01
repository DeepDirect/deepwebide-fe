import { useState } from 'react';
import BaseModal from '@/components/organisms/Modals/BaseModal/BaseModal';
import { useToastStore } from '@/stores/toastStore';
import styles from './SaveModal.module.scss';

interface SaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (message: string) => Promise<void>;
  isLoading?: boolean;
}

export function SaveModal({ open, onOpenChange, onSave, isLoading = false }: SaveModalProps) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { showToast } = useToastStore();

  const handleConfirm = async () => {
    if (!message.trim()) {
      setError('저장 메시지를 입력해주세요.');
      showToast({ message: '저장 메시지를 입력해주세요.', type: 'warning' });
      return;
    }

    try {
      setError('');
      await onSave(message.trim());
      setMessage('');
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Save error:', err);

      // API 에러 메시지 처리
      let errorMessage = '저장 중 오류가 발생했습니다.';

      if (err && typeof err === 'object' && 'response' in err) {
        const apiError = err as { response?: { data?: { message?: string } }; message?: string };
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      }

      setError(errorMessage);
      showToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleCancel = () => {
    setMessage('');
    setError('');
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setMessage('');
      setError('');
    }
    onOpenChange(isOpen);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={handleOpenChange}
      title="프로젝트 저장"
      confirmText={isLoading ? '저장 중...' : '저장'}
      cancelText="취소"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmDisabled={isLoading || !message.trim()}
      confirmVariant={message.trim() ? 'active' : 'inactive'}
      className={styles.saveModalWrapper}
    >
      <div className={styles.saveModalContent}>
        <div className={styles.description}>
          현재 프로젝트 상태를 저장하고 세이브 포인트를 생성합니다.
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="save-message" className={styles.label}>
            저장 메시지 *
          </label>
          <textarea
            id="save-message"
            className={styles.textarea}
            placeholder="예: 로그인 기능 구현 완료"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            maxLength={200}
            disabled={isLoading}
          />
          <div className={styles.charCount}>{message.length}/200</div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </BaseModal>
  );
}
