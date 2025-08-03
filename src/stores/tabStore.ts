import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OpenTab } from '@/types/repo/repo.types';
import type { TabStore } from '@/types/repo/tabStore.types';

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      openTabs: [],
      _hasHydrated: false,

      // 하이드레이션
      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      // 기본 탭 관리
      setOpenTabs: (tabs: OpenTab[]) => {
        console.log('setOpenTabs 호출:', tabs.length);
        set({ openTabs: tabs });
      },

      addTab: (tab: OpenTab) => {
        const state = get();
        const exists = state.openTabs.some(t => t.id === tab.id);

        if (exists) {
          set({
            openTabs: state.openTabs.map(t => ({
              ...t,
              isActive: t.id === tab.id,
            })),
          });
          console.log('기존 탭 활성화:', tab.name);
        } else {
          set({
            openTabs: [
              ...state.openTabs.map(t => ({ ...t, isActive: false })),
              { ...tab, isActive: true },
            ],
          });
          console.log('새 탭 추가:', tab.name);
        }
      },

      closeTab: (id: string) => {
        const state = get();
        const updatedTabs = state.openTabs.filter(tab => tab.id !== id);

        if (updatedTabs.length > 0 && !updatedTabs.some(tab => tab.isActive)) {
          updatedTabs[updatedTabs.length - 1].isActive = true;
        }

        console.log('탭 닫기:', { id, remainingTabs: updatedTabs.length });
        set({ openTabs: updatedTabs });
      },

      activateTab: (id: string) => {
        const state = get();
        const targetTab = state.openTabs.find(tab => tab.id === id);

        if (targetTab) {
          set({
            openTabs: state.openTabs.map(tab => ({
              ...tab,
              isActive: tab.id === id,
            })),
          });
          console.log('탭 활성화:', targetTab.name);
        }
      },

      // 파일 관련
      openFileByPath: (repoId: string, filePath: string, fileName?: string, fileId?: number) => {
        const state = get();
        const tabId = `${repoId}/${filePath}`;
        const existingTab = state.openTabs.find(tab => tab.id === tabId);

        console.log('openFileByPath 호출:', {
          repoId,
          filePath,
          fileName,
          fileId,
          tabId,
          existingTab: !!existingTab,
        });

        if (existingTab) {
          // 기존 탭이 있으면 fileId 업데이트하고 활성화
          set({
            openTabs: state.openTabs.map(tab => ({
              ...tab,
              isActive: tab.id === tabId,
              fileId: tab.id === tabId && fileId ? fileId : tab.fileId,
              isLoading: tab.id === tabId ? true : tab.isLoading,
            })),
          });
          console.log('기존 탭 활성화 및 fileId 업데이트:', existingTab.name);
        } else {
          const finalFileName =
            fileName ||
            (filePath.includes('/') ? filePath.split('/').pop() || 'untitled' : filePath);

          const newTab: OpenTab = {
            id: tabId,
            name: finalFileName,
            path: filePath,
            isActive: true,
            isDirty: false,
            content: '',
            fileId,
            isLoading: true,
            isDeleted: false,
            hasFileTreeMismatch: false,
          };

          set({
            openTabs: [...state.openTabs.map(t => ({ ...t, isActive: false })), newTab],
          });

          console.log('새 탭 생성:', {
            name: finalFileName,
            tabId,
            fileId,
            isLoading: true,
          });
        }
      },

      setTabContent: (tabId: string, content: string) => {
        const state = get();
        const targetTab = state.openTabs.find(tab => tab.id === tabId);

        // 삭제된 탭이나 파일트리 불일치 탭은 내용 변경 불가
        if (targetTab && (targetTab.isDeleted || targetTab.hasFileTreeMismatch)) {
          console.warn('삭제되었거나 변경된 파일의 내용 변경 시도 차단:', tabId);
          return;
        }

        console.log('setTabContent 호출:', {
          tabId,
          contentLength: content.length,
        });

        set({
          openTabs: state.openTabs.map(tab => {
            if (tab.id === tabId && !tab.isDeleted && !tab.hasFileTreeMismatch) {
              const isContentChanged = tab.content !== content;
              const isInitialLoad = tab.content === '';

              console.log('탭 내용 업데이트:', {
                tabId,
                name: tab.name,
                isInitialLoad,
                isContentChanged,
                oldContentLength: tab.content?.length || 0,
                newContentLength: content.length,
              });

              return {
                ...tab,
                content,
                isDirty: isInitialLoad ? false : tab.isDirty,
              };
            }
            return tab;
          }),
        });
      },

      setTabContentFromFile: (tabId: string, content: string) => {
        const state = get();
        const targetTab = state.openTabs.find(tab => tab.id === tabId);

        // 삭제된 탭이나 파일트리 불일치 탭은 내용 변경 불가
        if (targetTab && (targetTab.isDeleted || targetTab.hasFileTreeMismatch)) {
          console.warn('삭제되었거나 변경된 파일의 내용 로드 차단:', tabId);
          return;
        }

        console.log('setTabContentFromFile 호출:', {
          tabId,
          contentLength: content.length,
          timestamp: new Date().toISOString(),
        });

        set({
          openTabs: state.openTabs.map(tab =>
            tab.id === tabId && !tab.isDeleted && !tab.hasFileTreeMismatch
              ? {
                  ...tab,
                  content,
                  isDirty: false,
                  isLoading: false,
                }
              : tab
          ),
        });
      },

      setTabDirty: (tabId: string, isDirty: boolean) => {
        const state = get();
        const targetTab = state.openTabs.find(tab => tab.id === tabId);

        // 삭제된 탭이나 파일트리 불일치 탭은 dirty 상태 변경 불가
        if (targetTab && (targetTab.isDeleted || targetTab.hasFileTreeMismatch)) {
          return;
        }

        if (targetTab && targetTab.isDirty !== isDirty) {
          console.log('탭 dirty 상태 변경:', {
            tabId,
            name: targetTab.name,
            oldDirty: targetTab.isDirty,
            newDirty: isDirty,
          });

          set({
            openTabs: state.openTabs.map(tab =>
              tab.id === tabId && !tab.isDeleted && !tab.hasFileTreeMismatch
                ? { ...tab, isDirty }
                : tab
            ),
          });
        }
      },

      setTabLoading: (tabId: string, isLoading: boolean) => {
        const state = get();
        const targetTab = state.openTabs.find(tab => tab.id === tabId);

        if (targetTab && targetTab.isLoading !== isLoading) {
          console.log('탭 로딩 상태 변경:', {
            tabId,
            name: targetTab.name,
            oldLoading: targetTab.isLoading,
            newLoading: isLoading,
          });

          set({
            openTabs: state.openTabs.map(tab => (tab.id === tabId ? { ...tab, isLoading } : tab)),
          });
        }
      },

      clearTabsForRepo: (repoId: string) => {
        const state = get();
        const beforeCount = state.openTabs.length;
        const filteredTabs = state.openTabs.filter(tab => !tab.id.startsWith(`${repoId}/`));

        console.log('레포 탭 정리:', {
          repoId,
          before: beforeCount,
          after: filteredTabs.length,
          cleared: beforeCount - filteredTabs.length,
        });

        set({ openTabs: filteredTabs });
      },

      clearAllTabs: () => {
        console.log('모든 탭 정리 (복원 등으로 인한)');
        set({ openTabs: [] });
      },

      keepOnlyCurrentRepoTabs: (repoId: string) => {
        const state = get();
        const currentRepoTabs = state.openTabs.filter(tab => tab.id.startsWith(`${repoId}/`));

        if (currentRepoTabs.length !== state.openTabs.length) {
          if (currentRepoTabs.length > 0 && !currentRepoTabs.some(tab => tab.isActive)) {
            currentRepoTabs[0].isActive = true;
          }

          console.log('다른 레포 탭 정리:', {
            repoId,
            totalBefore: state.openTabs.length,
            currentRepoTabs: currentRepoTabs.length,
            cleared: state.openTabs.length - currentRepoTabs.length,
          });

          set({ openTabs: currentRepoTabs });
        }
      },

      updateTabFromFileTree: (fileId: number, fileName: string, path: string) => {
        const state = get();
        set({
          openTabs: state.openTabs.map(tab => {
            if (tab.fileId === fileId) {
              const repoId = tab.id.split('/')[0];
              const newTabId = `${repoId}/${path}`;
              console.log('파일트리 변경으로 탭을 변경된 상태로 표시:', {
                oldId: tab.id,
                newId: newTabId,
                oldName: tab.name,
                newName: fileName,
                oldPath: tab.path,
                newPath: path,
              });
              return {
                ...tab,
                hasFileTreeMismatch: true,
                isDeleted: false,
              };
            }
            return tab;
          }),
        });
      },

      markTabAsDeleted: (fileId: number) => {
        const state = get();
        const targetTab = state.openTabs.find(tab => tab.fileId === fileId);
        if (targetTab) {
          console.log('파일 삭제로 탭을 삭제됨으로 표시:', {
            tabId: targetTab.id,
            name: targetTab.name,
            fileId,
          });
          set({
            openTabs: state.openTabs.map(tab =>
              tab.fileId === fileId
                ? {
                    ...tab,
                    isDeleted: true,
                    hasFileTreeMismatch: false,
                  }
                : tab
            ),
          });
        }
      },

      syncTabsWithFileTree: (
        fileTreeNodes: Array<{ fileId: number; fileName: string; path: string }>
      ) => {
        const state = get();
        const fileTreeMap = new Map(fileTreeNodes.map(node => [node.fileId, node]));

        console.log('파일트리와 탭 동기화:', {
          fileTreeCount: fileTreeNodes.length,
          tabCount: state.openTabs.length,
        });

        const updatedTabs = state.openTabs.map(tab => {
          if (!tab.fileId) return tab;

          const fileTreeNode = fileTreeMap.get(tab.fileId);

          if (!fileTreeNode) {
            console.log('파일트리에서 제거된 탭을 삭제 상태로 표시:', {
              tabId: tab.id,
              name: tab.name,
            });
            return {
              ...tab,
              isDeleted: true,
              hasFileTreeMismatch: false,
            };
          }

          if (fileTreeNode.fileName !== tab.name || fileTreeNode.path !== tab.path) {
            console.log('파일트리 변경으로 탭을 변경된 상태로 표시:', {
              oldName: tab.name,
              newName: fileTreeNode.fileName,
              oldPath: tab.path,
              newPath: fileTreeNode.path,
            });
            return {
              ...tab,
              isDeleted: false,
              hasFileTreeMismatch: true,
            };
          }

          return { ...tab, isDeleted: false, hasFileTreeMismatch: false };
        });

        set({ openTabs: updatedTabs });
      },

      getTabById: (tabId: string) => {
        const state = get();
        return state.openTabs.find(tab => tab.id === tabId);
      },

      getActiveTab: () => {
        const state = get();
        return state.openTabs.find(tab => tab.isActive);
      },

      getDirtyTabs: () => {
        const state = get();
        return state.openTabs.filter(tab => tab.isDirty);
      },

      getTabsByRepo: (repoId: string) => {
        const state = get();
        return state.openTabs.filter(tab => tab.id.startsWith(`${repoId}/`));
      },
    }),
    {
      name: 'tab-storage',
      storage: createJSONStorage(() => localStorage),

      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('탭 상태 복원 실패:', error);
          try {
            localStorage.removeItem('tab-storage');
            console.log('손상된 탭 저장소 정리됨');
          } catch (cleanupError) {
            console.error('localStorage 정리 실패:', cleanupError);
          }
        } else if (state) {
          console.log('탭 상태 복원 완료:', {
            tabCount: state.openTabs.length,
            activeTabs: state.openTabs.filter(tab => tab.isActive).length,
            dirtyTabs: state.openTabs.filter(tab => tab.isDirty).length,
          });

          const activeTabs = state.openTabs.filter(tab => tab.isActive);
          if (state.openTabs.length > 0 && activeTabs.length !== 1) {
            console.log('활성 탭 상태 정리:', {
              activeCount: activeTabs.length,
              totalCount: state.openTabs.length,
            });

            state.openTabs = state.openTabs.map((tab, index) => ({
              ...tab,
              isActive: index === 0,
              isLoading: false,
            }));

            if (state.openTabs.length > 0) {
              console.log('첫 번째 탭 자동 활성화:', state.openTabs[0].name);
            }
          }

          state.setHasHydrated(true);
        }
      },

      partialize: state => ({
        openTabs: state.openTabs.map(tab => ({
          ...tab,
          isDirty: false,
          isLoading: false,
          content: (tab.content?.length || 0) > 100000 ? '' : tab.content,
          isDeleted: false,
          hasFileTreeMismatch: false,
        })),
      }),

      version: 1,
    }
  )
);
