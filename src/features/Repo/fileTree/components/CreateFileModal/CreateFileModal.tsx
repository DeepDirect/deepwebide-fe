import React, { useState, useEffect, useRef, useCallback } from 'react';
import BaseModal from '@/components/organisms/Modals/BaseModal/BaseModal';
import Input from '@/components/atoms/Input/Input';
import { validateFileName, validateFolderName } from '@/schemas/fileTree.schema';
import { useToast } from '@/hooks/common/useToast';
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
  const [warning, setWarning] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitializedRef = useRef(false);
  const toast = useToast();

  const isFile = type === 'FILE';
  const title = isFile ? '새 파일 생성' : '새 폴더 생성';
  const placeholder = isFile
    ? '파일명을 입력하세요 (예: index.js, main.py)'
    : '폴더명을 입력하세요 (예: components, utils)';

  // 파일/폴더명 유효성 검사
  const validateName = useCallback(
    (name: string) => {
      const validation = isFile ? validateFileName(name) : validateFolderName(name);
      return validation;
    },
    [isFile]
  );

  // 실시간 검증 함수
  const performRealTimeValidation = useCallback(
    (value: string) => {
      // 빈 값일 때는 아무 메시지도 표시하지 않음
      if (!value) {
        setError('');
        setWarning('');
        return;
      }

      const validation = validateName(value);

      if (!validation.isValid && validation.error) {
        setError(validation.error);
        setWarning('');
      } else if (validation.warning) {
        setError('');
        setWarning(validation.warning);
      } else {
        setError('');
        setWarning('');
      }
    },
    [validateName]
  );

  // 모달 초기화 함수
  const initializeModal = useCallback(() => {
    setFileName('');
    setError('');
    setWarning('');
    isInitializedRef.current = true;

    setTimeout(() => {
      if (inputRef.current && open) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  }, [open]);

  // 모달 정리 함수
  const cleanupModal = useCallback(() => {
    setFileName('');
    setError('');
    setWarning('');
    isInitializedRef.current = false;
  }, []);

  const handleConfirm = useCallback(() => {
    const trimmedName = fileName.trim();

    if (!trimmedName) {
      setError('이름을 입력해주세요.');
      setWarning('');
      toast.error('이름을 입력해주세요.');
      return;
    }

    // 최종 검증은 trim된 값으로
    const validation = validateName(trimmedName);
    if (!validation.isValid && validation.error) {
      setError(validation.error);
      setWarning('');
      toast.error(validation.error);
      return;
    }

    onConfirm(trimmedName, parentNode?.path);
    toast.success(`${isFile ? '파일' : '폴더'}이 생성되었습니다.`);
    cleanupModal();
    onOpenChange(false);
  }, [
    fileName,
    validateName,
    onConfirm,
    parentNode?.path,
    cleanupModal,
    onOpenChange,
    toast,
    isFile,
  ]);

  const handleCancel = useCallback(() => {
    cleanupModal();
    onOpenChange(false);
    onCancel?.();
  }, [cleanupModal, onOpenChange, onCancel]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFileName(value);
      performRealTimeValidation(value);
    },
    [performRealTimeValidation]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleConfirm, handleCancel]
  );

  const handleModalOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        handleCancel();
      }
    },
    [handleCancel]
  );

  // 모달이 열릴 때만 초기화
  useEffect(() => {
    if (open && !isInitializedRef.current) {
      initializeModal();
    } else if (!open && isInitializedRef.current) {
      cleanupModal();
    }
  }, [open, initializeModal, cleanupModal]);

  // 확인 버튼 비활성화: 에러가 있거나 빈 값일 때 (경고는 허용)
  const isConfirmDisabled = !fileName.trim() || !!error;

  // 성공 메시지 로직
  const getSuccessMessage = useCallback((): string | null => {
    if (!fileName.trim() || error || warning) return null;

    const trimmedName = fileName.trim();

    if (isFile) {
      if (trimmedName.startsWith('.') && trimmedName.length > 1) {
        return '✓ 설정 파일 형식입니다';
      }
      if (trimmedName.includes('.') && !trimmedName.startsWith('.')) {
        return '✓ 올바른 파일명 형식입니다';
      }
    } else {
      if (trimmedName.startsWith('.') && !trimmedName.includes('.', 1)) {
        return '✓ 숨김 폴더 형식입니다';
      }
      if (!trimmedName.includes('.')) {
        return '✓ 올바른 폴더명 형식입니다';
      }
    }

    return null;
  }, [fileName, error, warning, isFile]);

  const successMessage = getSuccessMessage();

  // 모달이 닫혀있으면 아예 렌더링하지 않음
  if (!open) {
    return null;
  }

  return (
    <BaseModal
      open={open}
      onOpenChange={handleModalOpenChange}
      title={title}
      confirmText="생성"
      cancelText="취소"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
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

          {/* Input을 wrapper로 감싸서 커스텀 스타일 적용 */}
          <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
            <Input
              ref={inputRef}
              value={fileName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {/* 에러 메시지 (빨간색) - 규칙 위반, 생성 불가 */}
          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.messageIcon}>⚠️</span>
              <span className={styles.messageText}>{error}</span>
            </div>
          )}

          {/* 경고 메시지 (주황색) - 권장사항, 생성 가능 */}
          {warning && !error && (
            <div className={styles.warningMessage}>
              <span className={styles.messageIcon}>💡</span>
              <span className={styles.messageText}>{warning}</span>
            </div>
          )}

          {/* 성공 메시지 (초록색) - 올바른 형식 */}
          {successMessage && (
            <div className={styles.successMessage}>
              <span className={styles.messageIcon}>✅</span>
              <span className={styles.messageText}>{successMessage}</span>
            </div>
          )}
        </div>

        <div className={styles.guidelines}>
          <h4 className={styles.guidelinesTitle}>{isFile ? '파일명' : '폴더명'} 작성 규칙</h4>
          <div className={styles.guidelinesContent}>
            <div className={styles.guidelinesSection}>
              <h5 className={styles.sectionTitle}>🔴 필수 규칙 (위반 시 생성 불가)</h5>
              <ul className={styles.rulesList}>
                <li>영어, 숫자, 점(.), 하이픈(-), 언더스코어(_)만 사용</li>
                <li>공백 사용 금지</li>
                <li>한글 및 특수문자 사용 금지</li>
                <li>시스템 예약어 사용 금지 (CON, PRN, AUX 등)</li>
                {isFile && <li>확장자 포함 또는 점(.)으로 시작</li>}
                {!isFile && <li>점(.) 사용 금지 (숨김 폴더 제외)</li>}
              </ul>
            </div>

            <div className={styles.guidelinesSection}>
              <h5 className={styles.sectionTitle}>🟡 권장 사항</h5>
              <ul className={styles.rulesList}>
                {isFile ? (
                  <li>일반 파일은 확장자 포함 권장 (예: .js, .ts, .md)</li>
                ) : (
                  <li>일반 폴더는 점(.) 사용 지양</li>
                )}
                <li>명확하고 의미있는 이름 사용</li>
              </ul>
            </div>

            <div className={styles.guidelinesSection}>
              <h5 className={styles.sectionTitle}>✅ 예시</h5>
              <div className={styles.examplesList}>
                {isFile ? (
                  <>
                    <span className={styles.exampleGood}>✓ index.js, main.py, README.md</span>
                    <span className={styles.exampleGood}>✓ .gitignore, .env, .eslintrc.js</span>
                  </>
                ) : (
                  <>
                    <span className={styles.exampleGood}>✓ components, utils, assets</span>
                    <span className={styles.exampleGood}>✓ .git, .vscode, .github</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default CreateFileModal;
