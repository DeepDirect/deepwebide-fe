import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { historyService } from './historyService';
import { SaveModal } from './SaveModal';
import AlertDialog from '@/components/molecules/AlertDialog/AlertDialog';
import { useToastStore } from '@/stores/toastStore';
import type { HistoryItem } from './types';
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
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  // 히스토리 목록 조회
  const {
    data: historiesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['histories', repoId],
    queryFn: () => historyService.getHistories(repoId),
    enabled: !!repoId,
  });

  const histories = historiesResponse?.data?.data || [];

  // 저장 뮤테이션
  const saveMutation = useMutation({
    mutationFn: (message: string) => historyService.saveHistory(repoId, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['histories', repoId] });
      showToast({ message: '프로젝트가 성공적으로 저장되었습니다.', type: 'success' });
    },
    onError: err => {
      console.error('Save error:', err);
      showToast({ message: '저장 중 오류가 발생했습니다.', type: 'error' });
    },
  });

  // 복원 뮤테이션
  const restoreMutation = useMutation({
    mutationFn: (historyId: number) => historyService.restoreHistory(repoId, historyId),
    onSuccess: () => {
      console.log('History restored successfully');
      // 복원 성공 시 히스토리 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['histories', repoId] });
      showToast({ message: '히스토리가 성공적으로 복원되었습니다.', type: 'success' });
    },
    onError: err => {
      console.error('Restore error:', err);
      showToast({ message: '복원 중 오류가 발생했습니다.', type: 'error' });
    },
  });

  const handleSave = async (message: string) => {
    await saveMutation.mutateAsync(message);
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
      } catch (err) {
        console.error('Restore error:', err);
        // 에러는 뮤테이션의 onError에서 처리됨
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
            {histories.map((history: HistoryItem) => (
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
