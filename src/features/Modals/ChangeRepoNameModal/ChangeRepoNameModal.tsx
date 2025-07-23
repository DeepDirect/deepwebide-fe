import React, { useState } from 'react';
import BaseModal from '@/components/organisms/Modals/BaseModal/BaseModal';
import Input from '@/components/atoms/Input/Input';
import styles from './ChangeRepoNameModal.module.scss';

export interface ChangeRepoNameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string; // TODO: API에서 현재 레포지토리 이름을 가져와야 함
  onConfirm: (newName: string) => void; // TODO: API로 레포지토리 이름 변경 요청을 보내야 함
  onCancel?: () => void;
}

const ChangeRepoNameModal: React.FC<ChangeRepoNameModalProps> = ({
  open,
  onOpenChange,
  currentName,
  onConfirm,
  onCancel,
}) => {
  const [newName, setNewName] = useState(currentName);

  const handleConfirm = () => {
    if (newName.trim() && newName.trim() !== currentName) {
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

  // 비활성화 조건: 새 이름이 비어있거나 기존 이름과 같을 때
  const isConfirmDisabled = !newName.trim() || newName.trim() === currentName;

  return (
    <BaseModal
      open={open}
      onOpenChange={handleOpenChange}
      title="레포지토리 이름 변경"
      confirmText="확인"
      cancelText="취소"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmVariant="active"
      confirmDisabled={isConfirmDisabled}
      confirmButtonType="submit"
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

export default ChangeRepoNameModal;
