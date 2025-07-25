import { useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { useResizer } from '@/hooks/useResizer';
import styles from './RepoPage.module.scss';
import TabBar from '@/components/organisms/TabBar/TabBar';

export function RepoPage() {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const repoId = params.repoId;
  const filePath = search.file;

  const { openTabs, activateTab } = useTabStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    width: fileSectionWidth,
    isResizing,
    startResize,
  } = useResizer({
    initialWidth: 25,
    minWidth: 10,
    maxWidth: 50,
    containerRef,
  });

  useEffect(() => {
    if (filePath && repoId) {
      // 현재 열린 탭 중에서 해당 경로의 탭 찾기
      const existingTab = openTabs.find(tab => tab.path === filePath);

      if (existingTab && !existingTab.isActive) {
        console.log('URL에서 기존 탭 활성화:', existingTab.name);
        activateTab(existingTab.id);
      }
      // 존재하지 않는 파일이면 새로 열지 않고 무시
    } else if (!filePath) {
      // URL에 파일 경로가 없으면 첫 번째 탭을 활성화
      const firstTab = openTabs[0];
      if (firstTab && !firstTab.isActive) {
        console.log('파일 경로 없음, 첫 번째 탭 활성화');
        activateTab(firstTab.id);
      }
    }
  }, [filePath, repoId, openTabs, activateTab]);

  return (
    <div ref={containerRef} className={`${styles.repoPage} ${isResizing ? styles.resizing : ''}`}>
      {/* 파일 구조 섹션 */}
      <div className={styles.fileSection} style={{ width: `${fileSectionWidth}%` }}>
        {/* 파일 트리 내용 */}
      </div>

      {/* 리사이저 */}
      <div className={styles.resizer} onMouseDown={startResize} />

      {/* 에디터 + 터미널 그룹 */}
      <div className={styles.editorGroup} style={{ width: `${100 - fileSectionWidth}%` }}>
        {/* 코드 에디터 */}
        <div className={styles.editorSection}>
          <TabBar repoId={repoId} />
          <div>에디터</div>
        </div>

        {/* 터미널 */}
        <div className={styles.terminalSection}></div>
      </div>
    </div>
  );
}
