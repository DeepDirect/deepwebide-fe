import { useParams, useSearch } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTabStore } from '@/stores/tabStore';
import styles from './RepoPage.module.scss';
import TabBar from '@/components/organisms/TabBar/TabBar';
import MonacoCollaborativeEditor from '@/components/organisms/CodeEditor/MonacoCollaborativeEditor';

export function RepoPage() {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const repoId = params.repoId;
  const filePath = search.file;

  const { openTabs, activateTab } = useTabStore();

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
    <div className={styles.repoPage}>
      {/* 파일 구조 섹션 */}
      <div className={styles.fileSection}></div>

      {/* 에디터 + 터미널 그룹 */}
      <div className={styles.editorGroup}>
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
        <div className={styles.terminalSection}></div>
      </div>
    </div>
  );
}
