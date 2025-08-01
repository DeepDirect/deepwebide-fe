import { useState } from 'react';
import { SaveModal } from './SaveModal';
import { useSavePoint } from './hooks/useSavePoint';
import { useSaveHistoryMutation, useRestoreHistoryMutation } from './hooks/useSavePointApi';
import AlertDialog from '@/components/molecules/AlertDialog/AlertDialog';
import { useToastStore } from '@/stores/toastStore';
import styles from './SavePoint.module.scss';

interface SavePointProps {
  repoId: string;
}

export function SavePoint({ repoId }: SavePointProps) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState<{
    isOpen: boolean;
    historyId: number | null;
    message: string;
  }>({
    isOpen: false,
    historyId: null,
    message: '',
  });

  const { showToast } = useToastStore();

  // Yjs 동기화가 포함된 훅들 사용
  const { histories, isLoading, error, refetch } = useSavePoint({ repositoryId: repoId });
  const saveMutation = useSaveHistoryMutation(repoId);
  const restoreMutation = useRestoreHistoryMutation(repoId);

  const handleSave = async (message: string) => {
    try {
      await saveMutation.mutateAsync({ message });
      showToast({ message: '프로젝트가 성공적으로 저장되었습니다.', type: 'success' });
    } catch (err) {
      console.error('Save error:', err);
      showToast({ message: '저장 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  const handleRestoreClick = (historyId: number, message: string) => {
    setRestoreDialog({
      isOpen: true,
      historyId,
      message,
    });
  };

  const handleRestoreConfirm = async () => {
    if (restoreDialog.historyId) {
      try {
        await restoreMutation.mutateAsync(restoreDialog.historyId);
        setRestoreDialog({ isOpen: false, historyId: null, message: '' });
        showToast({ message: '히스토리가 성공적으로 복원되었습니다.', type: 'success' });
      } catch (err) {
        console.error('Restore error:', err);
        showToast({ message: '복원 중 오류가 발생했습니다.', type: 'error' });
      }
    }
  };

  const handleRestoreCancel = () => {
    setRestoreDialog({ isOpen: false, historyId: null, message: '' });
  };

  const formatAbsoluteDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.savePoint}>
      <div className={styles.header}>
        <h3 className={styles.title}>프로젝트 히스토리</h3>
        <button
          className={styles.saveButton}
          onClick={() => setIsSaveModalOpen(true)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? '저장 중...' : '저장'}
        </button>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>히스토리를 불러오는 중...</div>
        ) : error ? (
          <div className={styles.error}>
            <p>히스토리 목록을 불러올 수 없습니다.</p>
            <button
              className={styles.retryButton}
              onClick={() => {
                refetch();
                showToast({ message: '히스토리 목록을 다시 불러오는 중...', type: 'info' });
              }}
            >
              다시 시도
            </button>
          </div>
        ) : histories.length === 0 ? (
          <div className={styles.emptyState}>
            <p>저장된 히스토리가 없습니다.</p>
            <p>첫 번째 저장점을 만들어보세요!</p>
          </div>
        ) : (
          <div className={styles.historyList}>
            {histories.map(history => (
              <div key={history.historyId} className={styles.historyItem}>
                <div className={styles.historyInfo}>
                  <div className={styles.historyMessage}>{history.message}</div>
                  <div className={styles.historyMeta}>
                    <span className={styles.author}>{history.createdBy.nickname}</span>
                    <span className={styles.separator}>•</span>
                    <span className={styles.date}>{formatAbsoluteDate(history.createdAt)}</span>
                  </div>
                </div>
                <div className={styles.historyActions}>
                  <button
                    className={styles.restoreButton}
                    onClick={() => handleRestoreClick(history.historyId, history.message)}
                    disabled={restoreMutation.isPending}
                    title="이 상태로 복원"
                  >
                    {restoreMutation.isPending && restoreDialog.historyId === history.historyId
                      ? '복원 중...'
                      : '복원'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SaveModal
        open={isSaveModalOpen}
        onOpenChange={setIsSaveModalOpen}
        onSave={handleSave}
        isLoading={saveMutation.isPending}
      />

      <AlertDialog
        open={restoreDialog.isOpen}
        onOpenChange={open => !open && handleRestoreCancel()}
        title="히스토리 복원"
        description={`"${restoreDialog.message}" 상태로 복원하시겠습니까?\n현재 작업 내용이 손실될 수 있습니다.`}
        confirmText={restoreMutation.isPending ? '복원 중...' : '복원'}
        cancelText="취소"
        onConfirm={handleRestoreConfirm}
        onCancel={handleRestoreCancel}
      />
    </div>
  );
}
