import { useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useTabStoreHydrated } from '@/hooks/repo/useTabStore.ts';
import { useFileSectionStore } from '@/stores/fileSectionStore';
import { useResizer } from '@/hooks/common/useResizer';
import { useFileContentLoader } from '@/hooks/repo/useFileContentLoader';
import { useRepositoryInfo } from '@/hooks/repo/useRepositoryInfo';
import Loading from '@/components/molecules/Loading/Loading';
import styles from './RepoPage.module.scss';
import TabBar from '@/components/organisms/TabBar/TabBar';
import MonacoCollaborativeEditor from '@/components/organisms/CodeEditor/MonacoCollaborativeEditor';
import CodeRunner from '@/features/CodeRunner/CodeRunner';
import { FileTree } from '@/features/Repo/fileTree';
import { SavePoint } from '@/features/Repo/savePoint';

export function RepoPage() {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const repoId = params.repoId;
  const filePath = search.file;

  const { openTabs, activateTab, hasHydrated, keepOnlyCurrentRepoTabs } = useTabStoreHydrated();
  const {
    isVisible: isFileSectionVisible,
    activeSection,
    toggleVisibility,
  } = useFileSectionStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // NOTE: 파일 섹션과 에디터 그룹 간의 수평 리사이저
  const {
    width: fileSectionWidth,
    isResizing: isHorizontalResizing,
    startResize: startHorizontalResize,
  } = useResizer({
    initialWidth: '300px',
    minWidth: '250px',
    maxWidth: '700px',
    containerRef,
  });

  // repoId를 숫자로 변환 (FileTree 컴포넌트에서 필요)
  const repositoryId = repoId ? parseInt(repoId, 10) : 0;

  // 저장소 정보 조회
  const { data: repositoryInfo } = useRepositoryInfo({
    repositoryId: repoId || '',
    enabled: hasHydrated && !!repoId,
  });

  // 협업 모드 자동 설정
  const enableCollaboration = Boolean(repositoryInfo?.isShared);

  // 파일 내용 자동 로드 훅 (하이드레이션 완료 후에만)
  useFileContentLoader({
    repositoryId,
    repoId: repoId || '',
    enabled: hasHydrated,
  });

  // 레포 변경 감지 및 다른 레포 탭 정리
  useEffect(() => {
    if (!hasHydrated || !repoId) return;

    // 현재 레포의 탭만 남기고 나머지 정리
    keepOnlyCurrentRepoTabs(repoId);
  }, [repoId, hasHydrated, keepOnlyCurrentRepoTabs]);

  // 키보드 단축키 추가
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        // Ctrl+B로 현재 활성 섹션 토글 (files가 기본)
        const currentSection = activeSection || 'files';
        if (isFileSectionVisible && activeSection === currentSection) {
          toggleVisibility();
        } else {
          // 닫혀있거나 다른 섹션이면 files 섹션 열기
          if (!isFileSectionVisible) {
            toggleVisibility();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleVisibility, isFileSectionVisible, activeSection]);

  // URL 파일 경로 변경 처리 (하이드레이션 완료 후에만)
  useEffect(() => {
    if (!hasHydrated) return; // 하이드레이션 완료까지 대기

    if (filePath && repoId) {
      // 현재 열린 탭 중에서 해당 경로의 탭 찾기
      const existingTab = openTabs.find(tab => tab.path === filePath);

      if (existingTab && !existingTab.isActive) {
        console.log('URL에서 기존 탭 활성화:', existingTab.name);
        activateTab(existingTab.id);
      }
      // 존재하지 않는 파일이면 파일트리에서 클릭했을 때 처리됨
    } else if (!filePath) {
      // URL에 파일 경로가 없으면 첫 번째 탭을 활성화
      const firstTab = openTabs[0];
      if (firstTab && !firstTab.isActive) {
        console.log('파일 경로 없음, 첫 번째 탭 활성화');
        activateTab(firstTab.id);
      }
    }
  }, [filePath, repoId, openTabs, activateTab, hasHydrated]);

  // 사이드바 섹션에 따른 컴포넌트 렌더링
  const renderSidebarContent = () => {
    switch (activeSection) {
      case 'files':
        return <FileTree repoId={repoId} repositoryId={repositoryId} />;
      case 'save':
        return <SavePoint repoId={repoId || ''} />;
      default:
        return null;
    }
  };

  // 유효하지 않은 repoId 처리
  if (!repoId || isNaN(repositoryId)) {
    return (
      <div className={styles.errorPage}>
        <h2>잘못된 저장소 ID입니다.</h2>
        <p>올바른 저장소 URL을 확인해주세요.</p>
      </div>
    );
  }

  // 하이드레이션 완료까지 로딩 표시
  if (!hasHydrated) {
    return <Loading />;
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.repoPage} ${isHorizontalResizing ? styles.horizontalResizing : ''} ${
        !isFileSectionVisible ? styles.hideFileSection : ''
      }`}
    >
      {/* 사이드바 섹션 - 조건부 렌더링 */}
      {isFileSectionVisible && (
        <>
          <div className={styles.fileSection} style={{ width: fileSectionWidth }}>
            {renderSidebarContent()}
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
              repositoryId={repositoryId}
              enableCollaboration={enableCollaboration} // 자동 설정으로 변경
              userId="current-user-id"
              userName="사용자명"
            />
          </div>
        </div>

        {/* 터미널 */}
        <div className={styles.terminalSection}>
          <CodeRunner repoId={repoId} repositoryName={repositoryInfo?.repositoryName} />
        </div>
      </div>
    </div>
  );
}
