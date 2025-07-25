import React, { useState } from 'react';
import BaseModal from '@/components/organisms/Modals/BaseModal/BaseModal';
import Input from '@/components/atoms/Input/Input';
import Select from '@/components/atoms/Select/Select';
import styles from './CreateRepoModal.module.scss';

export interface CreateRepoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; projectType: string }) => void;
  onCancel?: () => void;
}

const PROJECT_TYPES = [
  { value: 'Spring Boot', label: 'Spring Boot' },
  { value: 'React', label: 'React' },
  { value: 'FastAPI', label: 'FastAPI' },
];

const CreateRepoModal: React.FC<CreateRepoModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => {
  const [repoName, setRepoName] = useState('');
  const [projectType, setProjectType] = useState('Spring Boot');

  const handleConfirm = () => {
    // 레포지토리 이름이 비어있으면 아무것도 하지 않음
    if (!repoName.trim()) {
      return;
    }

    onConfirm({
      name: repoName.trim(),
      projectType,
    });
  };

  const handleCancel = () => {
    setRepoName('');
    setProjectType('Spring Boot');
    if (onCancel) {
      onCancel();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRepoName('');
      setProjectType('Spring Boot');
    }
    onOpenChange(open);
  };

  const isConfirmDisabled = !repoName.trim();

  return (
    <BaseModal
      open={open}
      onOpenChange={handleOpenChange}
      title="새 레포지토리 생성하기"
      confirmText="확인"
      cancelText="취소"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmVariant="active"
      confirmDisabled={isConfirmDisabled}
      confirmButtonType="submit"
      className={styles.createRepoModalWrapper}
    >
      <div className={styles.createRepoModal}>
        <div className={styles.formGroup}>
          <label className={styles.label}>레포지토리 이름</label>
          <Input
            value={repoName}
            onChange={e => setRepoName(e.target.value)}
            placeholder="프로젝트 이름을 입력하세요"
            className={styles.nameInput}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>프로젝트 종류</label>
          <Select
            options={PROJECT_TYPES}
            value={projectType}
            onValueChange={setProjectType}
            className={styles.projectSelect}
          />
        </div>
      </div>
    </BaseModal>
  );
};

export default CreateRepoModal;
