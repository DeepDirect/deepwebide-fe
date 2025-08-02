import { useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useTabStoreHydrated } from '@/hooks/repo/useTabStore.ts';
import { useFileSectionStore } from '@/stores/fileSectionStore';
import { useResizer } from '@/hooks/common/useResizer';
import { useRepositoryInfo } from '@/hooks/repo/useRepositoryInfo';
import { useFileSave } from '@/hooks/repo/useFileSave';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useAuthStore } from '@/stores/authStore';
import Loading from '@/components/molecules/Loading/Loading';
import styles from './RepoPage.module.scss';
import TabBar from '@/components/organisms/TabBar/TabBar';
import MonacoCollaborativeEditor from '@/components/organisms/CodeEditor/MonacoCollaborativeEditor';
import CodeRunner from '@/features/CodeRunner/CodeRunner';
import { FileTree } from '@/features/Repo/fileTree';
import { SavePoint } from '@/features/Repo/savePoint';

// Repository 타입 확장 (currentUser 포함)
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

  const { openTabs, activateTab, hasHydrated, keepOnlyCurrentRepoTabs } = useTabStoreHydrated();
  const {
    isVisible: isFileSectionVisible,
    activeSection,
    toggleVisibility,
  } = useFileSectionStore();
  const { currentUser, setCurrentUser, clearUsers } = useCollaborationStore();
  const { getUserInfo } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // 파일 섹션과 에디터 그룹 간의 수평 리사이저
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

  // repoId를 숫자로 변환
  const repositoryId = repoId ? parseInt(repoId, 10) : 0;

  // 저장소 정보 조회 및 협업 모드 설정
  const { data: repositoryInfo } = useRepositoryInfo({
    repositoryId: repoId || '',
    enabled: hasHydrated && !!repoId,
  });

  // 타입 안전하게 repositoryInfo 처리
  const typedRepositoryInfo = repositoryInfo as RepositoryWithUser | undefined;

  // 협업 모드 자동 설정
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

  // 사용자 정보 설정 (협업 모드용) - authStore nickname 우선 사용
  useEffect(() => {
    if (enableCollaboration && !currentUser.id) {
      // authStore에서 실제 사용자 정보 가져오기
      const authUser = getUserInfo();

      if (authUser) {
        // authStore의 정보를 우선 사용
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
        // authStore 정보가 없으면 repository 정보 사용 (fallback)
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
        // 둘 다 없으면 기본 사용자 생성
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

  // 파일 저장 시스템 (협업/일반 모드 모두 지원)
  const { enableContinuousSave, disableContinuousSave } = useFileSave({
    repositoryId,
    enabled: true,
    collaborationMode: enableCollaboration,
    // 협업 모드에서는 더 긴 주기로 저장 (Yjs와 충돌 방지)
    continuousSaveInterval: enableCollaboration ? 10000 : 5000,
  });

  // 활성 탭 변경 시 지속적 저장 관리
  const activeTab = openTabs.find(tab => tab.isActive);
  useEffect(() => {
    if (activeTab && activeTab.fileId) {
      console.log('활성 탭 변경 - 저장 시스템 업데이트:', {
        tabId: activeTab.id,
        fileName: activeTab.name,
        enableCollaboration,
        hasFileId: !!activeTab.fileId,
      });

      enableContinuousSave(activeTab.id);

      return () => {
        disableContinuousSave();
      };
    } else {
      // 활성 탭이 없거나 fileId가 없으면 저장 비활성화
      disableContinuousSave();
    }
  }, [
    activeTab?.id,
    activeTab?.fileId,
    enableCollaboration,
    enableContinuousSave,
    disableContinuousSave,
  ]);

  // 레포 변경 감지 및 다른 레포 탭 정리
  useEffect(() => {
    if (!hasHydrated || !repoId) return;

    console.log('레포 변경 감지:', {
      repoId,
      enableCollaboration,
      currentTabsCount: openTabs.length,
    });

    // 현재 레포의 탭만 남기고 나머지 정리
    keepOnlyCurrentRepoTabs(repoId);

    // 협업 모드가 비활성화되면 사용자 목록 정리
    if (!enableCollaboration) {
      clearUsers();
    }
  }, [repoId, hasHydrated, keepOnlyCurrentRepoTabs, enableCollaboration, clearUsers]);

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
    if (!hasHydrated) return;

    if (filePath && repoId) {
      // 현재 열린 탭 중에서 해당 경로의 탭 찾기
      const existingTab = openTabs.find(tab => tab.path === filePath);

      if (existingTab && !existingTab.isActive) {
        console.log('기존 탭 활성화:', existingTab.name);
        activateTab(existingTab.id);
      } else if (!existingTab) {
        console.log('URL 경로에 해당하는 탭이 없음:', filePath);
      }
    } else if (!filePath && openTabs.length > 0) {
      // URL에 파일 경로가 없으면 첫 번째 탭을 활성화
      const firstTab = openTabs[0];
      if (firstTab && !firstTab.isActive) {
        console.log('첫 번째 탭 활성화:', firstTab.name);
        activateTab(firstTab.id);
      }
    }
  }, [filePath, repoId, openTabs, activateTab, hasHydrated]);

  // 사이드바 섹션에 따른 컴포넌트 렌더링
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
      {/* 파일 구조 섹션 */}
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

        {/* 터미널 */}
        <div className={styles.terminalSection}>
          <CodeRunner repoId={repoId} />
        </div>
      </div>
    </div>
  );
}
