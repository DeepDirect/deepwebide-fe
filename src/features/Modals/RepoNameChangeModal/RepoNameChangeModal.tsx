import React, { useState } from 'react';
import BaseModal from '@/components/organisms/Modals/BaseModal/BaseModal';
import Input from '@/components/atoms/Input/Input';
import styles from './RepoNameChangeModal.module.scss';

export interface RepoNameChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string; // TODO: API에서 현재 레포지토리 이름을 가져와야 함
  onConfirm: (newName: string) => void; // TODO: API로 레포지토리 이름 변경 요청을 보내야 함
  onCancel?: () => void;
}

const RepoNameChangeModal: React.FC<RepoNameChangeModalProps> = ({
  open,
  onOpenChange,
  currentName,
  onConfirm,
  onCancel,
}) => {
  const [newName, setNewName] = useState(currentName);

  const handleConfirm = () => {
    if (newName.trim()) {
      onConfirm(newName.trim());
    }
  };

  const handleCancel = () => {
    setNewName(currentName);
    if (onCancel) {
      onCancel();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNewName(currentName);
    }
    onOpenChange(open);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={handleOpenChange}
      title="레포지토리 이름 변경"
      confirmText="확인"
      cancelText="취소"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    >
      <div className={styles.repoNameChangeModal}>
        <div className={styles.formGroup}>
          <label className={styles.label}>현재 이름</label>
          <Input value={currentName} disabled className={styles.disabledInput} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>변경할 이름을 입력해주세요</label>
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="새 프로젝트 이름"
            className={styles.nameInput}
          />
        </div>
      </div>
    </BaseModal>
  );
};

export default RepoNameChangeModal;
