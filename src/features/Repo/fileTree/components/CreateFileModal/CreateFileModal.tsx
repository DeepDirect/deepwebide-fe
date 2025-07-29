import React, { useState, useEffect } from 'react';
import BaseModal from '@/components/organisms/Modals/BaseModal/BaseModal';
import Input from '@/components/atoms/Input/Input';
import styles from './CreateFileModal.module.scss';
import type { FileTreeNode } from '../../types';

interface CreateFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'FILE' | 'FOLDER';
  parentNode?: FileTreeNode;
  onConfirm: (name: string, parentPath?: string) => void;
  onCancel?: () => void;
}

const CreateFileModal: React.FC<CreateFileModalProps> = ({
  open,
  onOpenChange,
  type,
  parentNode,
  onConfirm,
  onCancel,
}) => {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const isFile = type === 'FILE';
  const title = isFile ? '새 파일 생성' : '새 폴더 생성';
  const placeholder = isFile ? '파일명을 입력하세요 (예: index.js)' : '폴더명을 입력하세요';

  // 파일명 유효성 검사
  const validateFileName = (name: string): string => {
    if (!name.trim()) {
      return '이름을 입력해주세요.';
    }

    // 파일시스템에서 금지된 문자들
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      return '파일명에는 < > : " / \\ | ? * 문자를 사용할 수 없습니다.';
    }

    // 시작과 끝의 공백, 점 제거
    const trimmedName = name.trim();
    if (trimmedName.startsWith('.') && trimmedName.length === 1) {
      return '파일명은 단순히 "."일 수 없습니다.';
    }

    if (trimmedName === '..' || trimmedName === '...') {
      return '파일명으로 ".." 또는 "..."을 사용할 수 없습니다.';
    }

    // Windows 예약어 검사
    const reservedNames = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'COM5',
      'COM6',
      'COM7',
      'COM8',
      'COM9',
      'LPT1',
      'LPT2',
      'LPT3',
      'LPT4',
      'LPT5',
      'LPT6',
      'LPT7',
      'LPT8',
      'LPT9',
    ];

    const nameWithoutExt = trimmedName.split('.')[0].toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      return '이 이름은 시스템에서 예약된 이름입니다.';
    }

    // 파일명 길이 검사
    if (trimmedName.length > 255) {
      return '파일명이 너무 깁니다. (최대 255자)';
    }

    return '';
  };

  const handleConfirm = () => {
    const trimmedName = fileName.trim();
    const validationError = validateFileName(trimmedName);

    if (validationError) {
      setError(validationError);
      return;
    }

    onConfirm(trimmedName, parentNode?.path);
    handleClose();
  };

  const handleClose = () => {
    setFileName('');
    setError('');
    onOpenChange(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFileName(value);

    // 입력할 때마다 실시간 검증
    if (error && value.trim()) {
      const validationError = validateFileName(value);
      if (!validationError) {
        setError('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  };

  // 모달이 열릴 때 입력 필드에 포커스
  useEffect(() => {
    if (open) {
      // 상태 초기화
      setFileName('');
      setError('');

      const timer = setTimeout(() => {
        const input = document.querySelector(
          'input[placeholder*="입력하세요"]'
        ) as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const isConfirmDisabled = !fileName.trim() || !!error;
  const showExtensionWarning = isFile && fileName.trim() && !fileName.includes('.') && !error;

  return (
    <BaseModal
      open={open}
      onOpenChange={handleClose}
      title={title}
      confirmText="생성"
      cancelText="취소"
      onConfirm={handleConfirm}
      onCancel={handleClose}
      confirmVariant="active"
      confirmDisabled={isConfirmDisabled}
    >
      <div className={styles.createFileModal}>
        {parentNode && (
          <div className={styles.parentPath}>
            <span className={styles.label}>생성 위치:</span>
            <span className={styles.path}>{parentNode.path}/</span>
          </div>
        )}

        <div className={styles.inputGroup}>
          <label className={styles.label}>{isFile ? '파일명' : '폴더명'}</label>
          <Input
            value={fileName}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={error ? styles.errorInput : ''}
            autoComplete="off"
            spellCheck="false"
          />

          {error && <div className={styles.errorMessage}>{error}</div>}

          {showExtensionWarning && (
            <div className={styles.warningMessage}>
              확장자를 포함하는 것을 권장합니다 (예: .js, .ts, .md)
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default CreateFileModal;
