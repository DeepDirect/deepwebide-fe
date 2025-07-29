import styles from './DeleteSection.module.scss';
import DeleteIcon from '@/assets/icons/trash.svg?react';
import { useParams } from '@tanstack/react-router';
import useDeleteRepository from '@/hooks/useDeleteRepository';
import AlertDialogComponent from '@/components/molecules/AlertDialog/AlertDialog';
import { useState } from 'react';
// import { redirect } from '@tanstack/react-router';

const DeleteSection: React.FC = () => {
  const { repoId } = useParams({ strict: false });
  const [isOpen, setIsOpen] = useState(false);

  const { mutate: deleteRepository } = useDeleteRepository(`/api/repositories/${repoId}`, {
    onSuccess: () => {
      // 성공적으로 삭제된 후의 로직
      setIsOpen(false);
      // redirect({ to: '/main' });

      // TODO - 토스트 예정
      console.log('Repository deleted successfully');
    },
    onError: error => {
      // 에러 처리 로직
      // TODO 삭제 실패 alert 하면 좋을 듯?
      console.error('Error deleting repository:', error);
    },
  });

  const handleDelete = () => {
    if (repoId) {
      deleteRepository();
    } else {
      console.error('repository delete failed: repoId is undefined');
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
