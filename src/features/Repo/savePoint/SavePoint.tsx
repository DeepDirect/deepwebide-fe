import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { historyService } from './historyService';
import { SaveModal } from './SaveModal';
import type { HistoryItem } from './types';
import styles from './SavePoint.module.scss';

interface SavePointProps {
  repoId: string;
}

export function SavePoint({ repoId }: SavePointProps) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const queryClient = useQueryClient();

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
    },
    onError: err => {
      console.error('Save error:', err);
    },
  });

  // 복원 뮤테이션
  const restoreMutation = useMutation({
    mutationFn: (historyId: number) => historyService.restoreHistory(repoId, historyId),
    onSuccess: () => {
      console.log('History restored successfully');
      // 복원 성공 시 필요한 추가 작업 (예: 파일 새로고침 등)
    },
    onError: err => {
      console.error('Restore error:', err);
    },
  });

  const handleSave = async (message: string) => {
    await saveMutation.mutateAsync(message);
  };

  const handleRestore = async (historyId: number, message: string) => {
    if (
      window.confirm(`"${message}" 상태로 복원하시겠습니까?\n현재 작업 내용이 손실될 수 있습니다.`)
    ) {
      try {
        await restoreMutation.mutateAsync(historyId);
        alert('복원이 완료되었습니다.');
      } catch (err) {
        console.error('Restore error:', err);
        alert('복원 중 오류가 발생했습니다.');
      }
    }
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
            <button className={styles.retryButton} onClick={() => refetch()}>
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
                    onClick={() => handleRestore(history.historyId, history.message)}
                    disabled={restoreMutation.isPending}
                    title="이 상태로 복원"
                  >
                    {restoreMutation.isPending ? '복원 중...' : '복원'}
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
    </div>
  );
}
