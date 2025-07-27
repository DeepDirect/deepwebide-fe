import React, { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import styles from './InlineEdit.module.scss';

interface InlineEditProps {
  value: string;
  isEditing: boolean;
  onSave: (newValue: string) => Promise<void>;
  onCancel: () => void;
  className?: string;
  placeholder?: string;
  validateInput?: (value: string) => string; // 에러 메시지 반환, 없으면 빈 문자열
}

const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  isEditing,
  onSave,
  onCancel,
  className = '',
  placeholder = '',
  validateInput,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCancel = useCallback(() => {
    setInputValue(value);
    setError('');
    setIsLoading(false);
    onCancel();
  }, [value, onCancel]);

  // 편집 모드로 전환될 때 초기화
  useEffect(() => {
    if (isEditing) {
      setInputValue(value);
      setError('');
      setIsLoading(false);

      // 포커스 및 선택
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isEditing, value]);

  // 글로벌 클릭 이벤트로 편집 모드 종료
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, handleCancel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // 실시간 유효성 검사
    if (validateInput && newValue !== value) {
      const validationError = validateInput(newValue);
      setError(validationError);
    } else {
      setError('');
    }
  };

  const handleSave = async () => {
    const trimmedValue = inputValue.trim();

    // 값이 변경되지 않았으면 그냥 취소
    if (trimmedValue === value) {
      handleCancel();
      return;
    }

    // 유효성 검사
    if (validateInput) {
      const validationError = validateInput(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (!trimmedValue) {
      setError('이름을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await onSave(trimmedValue);
    } catch (error) {
      setError('저장에 실패했습니다.');
      console.error('Inline edit save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isLoading) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        handleSave();
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
        break;
    }
  };

  // 편집 모드가 아니면 일반 텍스트 표시
  if (!isEditing) {
    return <span className={className}>{value}</span>;
  }

  return (
    <div className={clsx(styles.inlineEdit, className)}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className={clsx(styles.input, {
          [styles.error]: !!error,
          [styles.loading]: isLoading,
        })}
      />

      {error && <div className={styles.errorTooltip}>{error}</div>}

      {isLoading && <div className={styles.loadingSpinner} />}
    </div>
  );
};

export default InlineEdit;
