import React, { useState } from 'react';
import clsx from 'clsx';
import { Select } from 'radix-ui';
import BaseModal from '@/components/organisms/Modals/BaseModal/BaseModal';
import Input from '@/components/atoms/Input/Input';
import styles from './CreateRepoModal.module.scss';

export interface CreateRepoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; projectType: string }) => void;
  onCancel?: () => void;
}

const PROJECT_TYPES = [
  { value: 'spring-boot', label: 'Spring Boot' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'angular', label: 'Angular' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'other', label: '기타' },
];

const CreateRepoModal: React.FC<CreateRepoModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => {
  const [repoName, setRepoName] = useState('');
  const [projectType, setProjectType] = useState('spring-boot');

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
    setProjectType('spring-boot');
    if (onCancel) {
      onCancel();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRepoName('');
      setProjectType('spring-boot');
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
      className={clsx(styles.createRepoModalWrapper, {
        [styles.confirmDisabled]: isConfirmDisabled,
      })}
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
          <Select.Root value={projectType} onValueChange={setProjectType}>
            <Select.Trigger className={styles.selectTrigger}>
              <Select.Value />
              <Select.Icon className={styles.selectIcon}>
                <img src="/src/assets/icons/chevron-down.svg" alt="" />
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content
                className={styles.selectContent}
                position="popper"
                side="bottom"
                align="start"
                avoidCollisions={false}
                sticky="always"
              >
                <Select.Viewport className={styles.selectViewport}>
                  {PROJECT_TYPES.map(type => (
                    <Select.Item key={type.value} value={type.value} className={styles.selectItem}>
                      <Select.ItemText>{type.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>
    </BaseModal>
  );
};

export default CreateRepoModal;
