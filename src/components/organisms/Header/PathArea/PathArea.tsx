import { useEffect, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import styles from './PathArea.module.scss';
import NoteMultipleIcon from '@/assets/icons/note-multiple.svg?react';
import { useTabStore } from '@/stores/tabStore';
import { useToast } from '@/hooks/common/useToast';

const PathArea = () => {
  const { repoId } = useParams({ strict: false });
  const { openTabs } = useTabStore();
  const toast = useToast();
  const [currentPath, setCurrentPath] = useState('');
  const [displayPath, setDisplayPath] = useState('');

  // 활성 탭의 경로 가져오기
  useEffect(() => {
    if (repoId) {
      const activeTab = openTabs.find(tab => tab.isActive && tab.id.startsWith(`${repoId}/`));

      if (activeTab) {
        const filePath = activeTab.path;
        setCurrentPath(filePath);
      } else {
        setCurrentPath('');
      }
    } else {
      setCurrentPath('');
    }
  }, [openTabs, repoId]);

  // 경로가 너무 길면 앞부분을 ...으로 처리
  useEffect(() => {
    if (!currentPath) {
      setDisplayPath('');
      return;
    }

    const maxLength = 50; // 최대 표시 길이

    if (currentPath.length > maxLength) {
      setDisplayPath(`...${currentPath.slice(-(maxLength - 3))}`);
    } else {
      setDisplayPath(currentPath);
    }
  }, [currentPath]);

  // 클립보드 복사 함수
  const handleCopyToClipboard = async () => {
    if (currentPath) {
      try {
        await navigator.clipboard.writeText(currentPath);

        // 성공 토스트 표시
        toast.success('파일 경로가 클립보드에 복사되었습니다', 2000);
      } catch {
        // 실패 토스트 표시
        toast.error('클립보드 복사에 실패했습니다', 3000);
      }
    }
  };

  return (
    <div className={styles.pathArea}>
      <div className={styles.path} title={currentPath || ''}>
        {displayPath}
      </div>
      <button
        className={styles.iconButton}
        onClick={handleCopyToClipboard}
        title={currentPath ? '경로 복사' : '복사할 경로가 없습니다'}
        disabled={!currentPath}
      >
        <NoteMultipleIcon className={styles.icon} />
      </button>
    </div>
  );
};

export default PathArea;
