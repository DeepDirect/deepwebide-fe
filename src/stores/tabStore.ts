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
              isLoading: tab.id === tabId ? true : tab.isLoading, // 로딩 상태 설정
            })),
          });
          console.log('기존 탭 활성화 및 fileId 업데이트:', existingTab.name);
        } else {
          // 새 탭 생성
          const finalFileName =
            fileName ||
            (filePath.includes('/') ? filePath.split('/').pop() || 'untitled' : filePath);

          const newTab: OpenTab = {
            id: tabId,
            name: finalFileName,
            path: filePath,
            isActive: true,
            isDirty: false,
            content: '', // 초기에는 빈 내용으로 시작
            fileId,
            isLoading: true, // 새 탭은 로딩 상태로 시작
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
        console.log('setTabContent 호출:', {
          tabId,
          contentLength: content.length,
        });

        set({
          openTabs: state.openTabs.map(tab => {
            if (tab.id === tabId) {
              // 기존 내용과 다른지 확인
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
                // 초기 로드시는 clean 상태, 내용 변경시는 기존 dirty 상태 유지
                isDirty: isInitialLoad ? false : tab.isDirty,
              };
            }
            return tab;
          }),
        });
      },

      // 파일에서 처음 내용을 로드할 때 사용할 메서드 (항상 clean 상태)
      setTabContentFromFile: (tabId: string, content: string) => {
        const state = get();
        console.log('setTabContentFromFile 호출:', {
          tabId,
          contentLength: content.length,
          timestamp: new Date().toISOString(),
        });

        set({
          openTabs: state.openTabs.map(tab =>
            tab.id === tabId
              ? {
                  ...tab,
                  content,
                  isDirty: false, // 파일에서 로드한 내용은 항상 clean 상태
                  isLoading: false, // 로딩 완료
                }
              : tab
          ),
        });
      },

      setTabDirty: (tabId: string, isDirty: boolean) => {
        const state = get();
        const targetTab = state.openTabs.find(tab => tab.id === tabId);

        if (targetTab && targetTab.isDirty !== isDirty) {
          console.log('탭 dirty 상태 변경:', {
            tabId,
            name: targetTab.name,
            oldDirty: targetTab.isDirty,
            newDirty: isDirty,
          });

          set({
            openTabs: state.openTabs.map(tab => (tab.id === tabId ? { ...tab, isDirty } : tab)),
          });
        }
      },

      // 탭 로딩 상태 설정
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

      // 레포지토리 관련
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

      // 디버그 헬퍼
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

      // 하이드레이션 로직 개선
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('탭 상태 복원 실패:', error);
          // 에러 발생시 localStorage 클리어하여 무한루프 방지
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

          // 활성 탭이 없거나 여러 개면 정리
          const activeTabs = state.openTabs.filter(tab => tab.isActive);
          if (state.openTabs.length > 0 && activeTabs.length !== 1) {
            console.log('활성 탭 상태 정리:', {
              activeCount: activeTabs.length,
              totalCount: state.openTabs.length,
            });

            // 모든 탭을 비활성화하고 첫 번째 탭만 활성화
            state.openTabs = state.openTabs.map((tab, index) => ({
              ...tab,
              isActive: index === 0,
              isLoading: false, // 복원 시 로딩 상태 초기화
            }));

            if (state.openTabs.length > 0) {
              console.log('첫 번째 탭 자동 활성화:', state.openTabs[0].name);
            }
          }

          // 하이드레이션 완료 표시
          state.setHasHydrated(true);
        }
      },

      // 저장할 데이터 최적화
      partialize: state => ({
        openTabs: state.openTabs.map(tab => ({
          ...tab,
          // 저장할 때는 dirty 상태를 false로 리셋 (새로고침 시 clean 상태로 시작)
          isDirty: false,
          // 로딩 상태도 false로 리셋
          isLoading: false,
          // 내용이 너무 크면 저장하지 않음 (성능 최적화)
          content: (tab.content?.length || 0) > 100000 ? '' : tab.content,
        })),
      }),

      // 저장/복원 에러 시 재시도 방지
      version: 1, // 스키마 버전 관리
    }
  )
);
