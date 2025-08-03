import { useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useTabStoreHydrated } from '@/hooks/repo/useTabStore.ts';
import { useFileSectionStore } from '@/stores/fileSectionStore';
import { useResizer } from '@/hooks/common/useResizer';
import { useRepositoryInfo } from '@/hooks/repo/useRepositoryInfo';
import { useFileSave } from '@/hooks/repo/useFileSave';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useAuthStore } from '@/stores/authStore';
import { useFileContentLoader } from '@/hooks/repo/useFileContentLoader';
import { useYjsSavePoint } from '@/hooks/repo/useYjsSavePoint';
import Loading from '@/components/molecules/Loading/Loading';
import styles from './RepoPage.module.scss';
import TabBar from '@/components/organisms/TabBar/TabBar';
import MonacoCollaborativeEditor from '@/components/organisms/CodeEditor/MonacoCollaborativeEditor';
import CodeRunner from '@/features/CodeRunner/CodeRunner';
import { FileTree } from '@/features/Repo/fileTree';
import { SavePoint } from '@/features/Repo/savePoint';

interface RepositoryWithUser {
  repositoryId: number;
  repositoryName: string;
  ownerId: number;
  ownerName: string;
  shareLink: string | null;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  currentUser?: {
    id: string | number;
    name: string;
    email?: string;
  };
}

export function RepoPage() {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const repoId = params.repoId;
  const filePath = search.file;

  const {
    openTabs,
    activateTab,
    hasHydrated,
    keepOnlyCurrentRepoTabs,
    clearTabsForRepo,
    clearAllTabs,
  } = useTabStoreHydrated();
  const {
    isVisible: isFileSectionVisible,
    activeSection,
    toggleVisibility,
  } = useFileSectionStore();
  const { currentUser, setCurrentUser, clearUsers } = useCollaborationStore();
  const { getUserInfo } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);

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

  const repositoryId = repoId ? parseInt(repoId, 10) : 0;

  const { data: repositoryInfo } = useRepositoryInfo({
    repositoryId: repoId || '',
    enabled: hasHydrated && !!repoId,
  });

  const typedRepositoryInfo = repositoryInfo as RepositoryWithUser | undefined;

  const enableCollaboration = Boolean(typedRepositoryInfo?.isShared);

  console.log('RepoPage 상태:', {
    repoId,
    repositoryId,
    isShared: typedRepositoryInfo?.isShared,
    enableCollaboration,
    hasRepositoryInfo: !!typedRepositoryInfo,
    openTabsCount: openTabs.length,
    activeTabPath: openTabs.find(tab => tab.isActive)?.path,
  });

  const { yMap: savePointYMap } = useYjsSavePoint(repositoryId);

  useEffect(() => {
    if (!savePointYMap) return;

    const handleRestoreEvent = () => {
      const lastOperation = savePointYMap.get('lastOperation') as
        | {
            type: string;
            data: unknown;
            timestamp: number;
          }
        | undefined;

      if (lastOperation?.type === 'restore') {
        const now = Date.now();
        const timeDiff = now - lastOperation.timestamp;

        if (timeDiff < 3000) {
          console.log('RepoPage: 복원 이벤트 감지 - 모든 탭과 에디터 상태 초기화');
          clearAllTabs();
          localStorage.removeItem('tab-storage');
          window.location.reload();
        }
      }
    };

    savePointYMap.observe(handleRestoreEvent);
    return () => savePointYMap.unobserve(handleRestoreEvent);
  }, [savePointYMap, clearAllTabs]);

  useFileContentLoader({
    repositoryId,
    repoId: repoId || '',
    enabled: hasHydrated && !!repoId,
    enableCollaboration,
  });

  useEffect(() => {
    if (enableCollaboration && !currentUser.id) {
      const authUser = getUserInfo();

      if (authUser) {
        setCurrentUser({
          id: String(authUser.id || `user-${Date.now()}`),
          name: authUser.nickname || authUser.username || 'Anonymous User',
          color: '',
          lastSeen: Date.now(),
        });
        console.log('협업 모드 사용자 설정 (authStore):', {
          id: authUser.id,
          name: authUser.nickname || authUser.username,
        });
      } else if (typedRepositoryInfo?.currentUser) {
        const repoUser = typedRepositoryInfo.currentUser;
        setCurrentUser({
          id: String(repoUser.id || `user-${Date.now()}`),
          name: repoUser.name || 'Anonymous User',
          color: '',
          lastSeen: Date.now(),
        });
        console.log('협업 모드 사용자 설정 (repository):', {
          id: repoUser.id,
          name: repoUser.name,
        });
      } else {
        const fallbackUser = {
          id: `user-${Date.now()}`,
          name: 'Anonymous User',
          color: '',
          lastSeen: Date.now(),
        };
        setCurrentUser(fallbackUser);
        console.log('협업 모드 사용자 설정 (fallback):', fallbackUser);
      }
    }
  }, [
    enableCollaboration,
    typedRepositoryInfo?.currentUser,
    currentUser.id,
    setCurrentUser,
    getUserInfo,
  ]);

  const { enableContinuousSave, disableContinuousSave } = useFileSave({
    repositoryId,
    enabled: true,
    collaborationMode: enableCollaboration,
    continuousSaveInterval: enableCollaboration ? 10000 : 5000,
  });

  const activeTab = openTabs.find(tab => tab.isActive);
  const activeTabId = activeTab?.id;
  const activeTabFileId = activeTab?.fileId;
  const activeTabName = activeTab?.name;

  useEffect(() => {
    if (activeTabId && activeTabFileId) {
      console.log('활성 탭 변경 - 저장 시스템 업데이트:', {
        tabId: activeTabId,
        fileName: activeTabName,
        enableCollaboration,
        hasFileId: !!activeTabFileId,
      });

      enableContinuousSave(activeTabId);

      return () => {
        disableContinuousSave();
      };
    } else {
      disableContinuousSave();
    }
  }, [
    activeTabId,
    activeTabFileId,
    activeTabName,
    enableCollaboration,
    enableContinuousSave,
    disableContinuousSave,
  ]);

  useEffect(() => {
    if (!hasHydrated || !repoId) return;

    console.log('레포 변경 감지:', {
      repoId,
      enableCollaboration,
      currentTabsCount: openTabs.length,
    });

    keepOnlyCurrentRepoTabs(repoId);

    if (!enableCollaboration) {
      clearUsers();
    }
  }, [
    repoId,
    hasHydrated,
    openTabs.length,
    keepOnlyCurrentRepoTabs,
    enableCollaboration,
    clearUsers,
  ]);

  useEffect(() => {
    return () => {
      if (repoId) {
        console.log('RepoPage 언마운트 - 모든 탭 정리:', repoId);
        clearTabsForRepo(repoId);
      }
    };
  }, [repoId, clearTabsForRepo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        const currentSection = activeSection || 'files';
        if (isFileSectionVisible && activeSection === currentSection) {
          toggleVisibility();
        } else {
          if (!isFileSectionVisible) {
            toggleVisibility();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleVisibility, isFileSectionVisible, activeSection]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (filePath && repoId) {
      const existingTab = openTabs.find(tab => tab.path === filePath);

      if (existingTab && !existingTab.isActive) {
        console.log('기존 탭 활성화:', existingTab.name);
        activateTab(existingTab.id);
      } else if (!existingTab) {
        console.log('URL 경로에 해당하는 탭이 없음:', filePath);
      }
    } else if (!filePath && openTabs.length > 0) {
      const firstTab = openTabs[0];
      if (firstTab && !firstTab.isActive) {
        console.log('첫 번째 탭 활성화:', firstTab.name);
        activateTab(firstTab.id);
      }
    }
  }, [filePath, repoId, openTabs, activateTab, hasHydrated]);

  const renderSidebarContent = () => {
    switch (activeSection) {
      case 'files':
        return (
          <FileTree
            repoId={repoId}
            repositoryId={repositoryId}
            enableCollaboration={enableCollaboration}
          />
        );
      case 'save':
        return <SavePoint repoId={repoId || ''} />;
      default:
        return null;
    }
  };

  if (!repoId || isNaN(repositoryId)) {
    return (
      <div className={styles.errorPage}>
        <h2>잘못된 저장소 ID입니다.</h2>
        <p>올바른 저장소 URL을 확인해주세요.</p>
      </div>
    );
  }

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
      {isFileSectionVisible && (
        <>
          <div className={styles.fileSection} style={{ width: fileSectionWidth }}>
            {renderSidebarContent()}
          </div>

          <div
            className={`${styles.resizer} ${styles.horizontalResizer}`}
            onMouseDown={startHorizontalResize}
          />
        </>
      )}

      <div
        className={styles.editorGroup}
        style={{
          width: isFileSectionVisible ? `calc(100% - ${fileSectionWidth} - 6px)` : '100%',
        }}
      >
        <div className={styles.editorSection}>
          <div className={styles.tabBarContainer}>
            <TabBar repoId={repoId} />
          </div>
          <div className={styles.editorContainer}>
            <MonacoCollaborativeEditor
              repoId={repoId}
              repositoryId={repositoryId}
              enableCollaboration={enableCollaboration}
              userId={currentUser.id || String(getUserInfo()?.id) || `user-${repositoryId}`}
              userName={
                currentUser.name ||
                getUserInfo()?.nickname ||
                getUserInfo()?.username ||
                'Anonymous'
              }
            />
          </div>
        </div>

        <div className={styles.terminalSection}>
          <CodeRunner
            repoId={repoId}
            repositoryName={repositoryInfo?.repositoryName}
            enableCollaboration={enableCollaboration}
            userId={currentUser.id || String(getUserInfo()?.id) || `user-${repositoryId}`}
            userName={
              currentUser.name || getUserInfo()?.nickname || getUserInfo()?.username || 'Anonymous'
            }
          />
        </div>
      </div>
    </div>
  );
}
