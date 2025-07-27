import { useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { useFileSectionStore } from '@/stores/fileSectionStore';
import { useResizer } from '@/hooks/useResizer';
import styles from './RepoPage.module.scss';
import TabBar from '@/components/organisms/TabBar/TabBar';
import MonacoCollaborativeEditor from '@/components/organisms/CodeEditor/MonacoCollaborativeEditor';
import CodeRunner from '@/features/CodeRunner/CodeRunner';
import { FileTree } from '@/features/Repo/fileTree';
import { fileTreeMockData } from '@/mocks/fileTreeMockData';

export function RepoPage() {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const repoId = params.repoId;
  const filePath = search.file;

  const { openTabs, activateTab } = useTabStore();
  const { isVisible: isFileSectionVisible } = useFileSectionStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // FileTree 상태 관리 (실제 API가 없으므로 목업 데이터 사용)
  const [isFileTreeLoading] = useState(false);
  const [fileTreeError] = useState<string | null>(null);

  // NOTE: 파일 섹션과 에디터 그룹 간의 수평 리사이저
  const {
    width: fileSectionWidth,
    isResizing: isHorizontalResizing,
    startResize: startHorizontalResize,
  } = useResizer({
    initialWidth: '300px',
    minWidth: '200px',
    maxWidth: '500px',
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

  // TODO: 실제 API 연동 시 이 부분을 실제 API 호출로 변경
  // useEffect(() => {
  //   const fetchFileTree = async () => {
  //     setIsFileTreeLoading(true);
  //     try {
  //       const response = await apiClient.get(`/api/repos/${repoId}/files`);
  //       setFileTreeData(response.data);
  //       setFileTreeError(null);
  //     } catch (error) {
  //       setFileTreeError('파일 트리를 불러오는데 실패했습니다.');
  //     } finally {
  //       setIsFileTreeLoading(false);
  //     }
  //   };
  //
  //   if (repoId) {
  //     fetchFileTree();
  //   }
  // }, [repoId]);

  return (
    <div
      ref={containerRef}
      className={`${styles.repoPage} ${isHorizontalResizing ? styles.horizontalResizing : ''} ${
        !isFileSectionVisible ? styles.hideFileSection : ''
      }`}
    >
      {/* 파일 구조 섹션 - 조건부 렌더링 */}
      {isFileSectionVisible && (
        <>
          <div className={styles.fileSection} style={{ width: fileSectionWidth }}>
            <FileTree
              repoId={repoId || 'default'}
              apiData={fileTreeMockData} // TODO: 실제 API 데이터로 교체
              isLoading={isFileTreeLoading}
              error={fileTreeError}
            />
          </div>

          {/* 수평 리사이저 */}
          <div
            className={`${styles.resizer} ${styles.horizontalResizer}`}
            onMouseDown={startHorizontalResize}
          />
        </>
      )}

      {/* 에디터 + 터미널 그룹 */}
      <div
        className={styles.editorGroup}
        style={{
          width: isFileSectionVisible ? `calc(100% - ${fileSectionWidth} - 6px)` : '100%',
        }}
      >
        {/* 코드 에디터 */}
        <div className={styles.editorSection}>
          <div className={styles.tabBarContainer}>
            <TabBar repoId={repoId} />
          </div>
          <div className={styles.editorContainer}>
            <MonacoCollaborativeEditor
              repoId={repoId}
              enableCollaboration={true}
              userId="current-user-id"
              userName="사용자명"
            />
          </div>
        </div>

        {/* 터미널 */}
        <div className={styles.terminalSection}>
          <CodeRunner repoId={repoId} />
        </div>
      </div>
    </div>
  );
}
