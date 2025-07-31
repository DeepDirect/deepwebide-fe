import styles from './DeleteSection.module.scss';
import DeleteIcon from '@/assets/icons/trash.svg?react';
import { useNavigate, useParams } from '@tanstack/react-router';
import useDeleteRepository from '@/hooks/main/useDeleteRepository';
import AlertDialogComponent from '@/components/molecules/AlertDialog/AlertDialog';
import { useState } from 'react';
import { useToast } from '@/hooks/common/useToast';

const DeleteSection: React.FC = () => {
  const { repoId } = useParams({ strict: false });
  const [isOpen, setIsOpen] = useState(false);
  const navigator = useNavigate();
  const toast = useToast();

  const { mutate: deleteRepository } = useDeleteRepository(`/api/repositories/${repoId}`, {
    onSuccess: () => {
      setIsOpen(false);
      navigator({
        to: '/$repoId',
        params: { repoId },
      });
      //   toast.success('레포지토리가 삭제되었습니다.');
    },
    onError: () => {
      toast.error('레포지토리 삭제에 실패했습니다.');
    },
  });

  const handleDelete = () => {
    if (repoId) {
      deleteRepository();
    } else {
      toast.error('레포지토리 삭제에 실패했습니다.');
    }
  };

  return (
    <section className={styles.deleteSection} id="deleteSection">
      <div className={styles.sectionTitleWrapper}>
        <DeleteIcon className={styles.nameIcon} />
        <h2 className={styles.sectionTitle}>DELETE</h2>
      </div>

      <div className={styles.flex}>
        <div className={`${styles.label} ${styles.textBlue}`}>DELETE</div>

        <div className={styles.buttonWrapper}>
          <button className={styles.deleteButton} onClick={() => setIsOpen(true)}>
            <DeleteIcon className={styles.buttonIcon} />
            삭제
          </button>
        </div>
      </div>
      <AlertDialogComponent
        open={isOpen}
        onOpenChange={setIsOpen}
        title="레포지토리를 삭제하시겠습니까?"
        confirmText="삭제하기"
        cancelText="취소"
        onConfirm={handleDelete}
        showCancel
      />
    </section>
  );
};

export default DeleteSection;
