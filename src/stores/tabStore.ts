import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OpenTab } from '@/types/repo/repo.types';

interface TabStore {
  openTabs: OpenTab[];
  _hasHydrated: boolean;
  setOpenTabs: (tabs: OpenTab[]) => void;
  addTab: (tab: OpenTab) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  openFileByPath: (repoId: string, filePath: string, fileName?: string) => void;
  setTabContent: (tabId: string, content: string) => void;
  setTabDirty: (tabId: string, isDirty: boolean) => void;
  clearTabsForRepo: (repoId: string) => void;
  keepOnlyCurrentRepoTabs: (repoId: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      openTabs: [],
      _hasHydrated: false,

      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      setOpenTabs: (tabs: OpenTab[]) => {
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
        } else {
          set({
            openTabs: [
              ...state.openTabs.map(t => ({ ...t, isActive: false })),
              { ...tab, isActive: true },
            ],
          });
        }
      },

      closeTab: (id: string) => {
        const state = get();
        const updatedTabs = state.openTabs.filter(tab => tab.id !== id);

        if (updatedTabs.length > 0 && !updatedTabs.some(tab => tab.isActive)) {
          updatedTabs[updatedTabs.length - 1].isActive = true;
        }

        set({ openTabs: updatedTabs });
      },

      activateTab: (id: string) => {
        const state = get();
        set({
          openTabs: state.openTabs.map(tab => ({
            ...tab,
            isActive: tab.id === id,
          })),
        });
      },

      openFileByPath: (repoId: string, filePath: string, fileName?: string) => {
        const state = get();
        const tabId = `${repoId}/${filePath}`;

        const existingTab = state.openTabs.find(tab => tab.id === tabId);

        if (existingTab) {
          // 이미 있는 탭이면 활성화만
          set({
            openTabs: state.openTabs.map(tab => ({
              ...tab,
              isActive: tab.id === tabId,
            })),
          });
        } else {
          // 새 탭 생성 (파일 내용은 나중에 API로 가져옴)
          const finalFileName =
            fileName ||
            (filePath.includes('/') ? filePath.split('/').pop() || 'untitled' : filePath);

          const newTab: OpenTab = {
            id: tabId,
            name: finalFileName,
            path: filePath,
            isActive: true,
            isDirty: false,
            content: '', // 초기에는 빈 문자열, API로 나중에 가져옴
          };

          set({
            openTabs: [...state.openTabs.map(t => ({ ...t, isActive: false })), newTab],
          });
        }
      },

      setTabContent: (tabId: string, content: string) => {
        const state = get();
        set({
          openTabs: state.openTabs.map(tab => (tab.id === tabId ? { ...tab, content } : tab)),
        });
      },

      setTabDirty: (tabId: string, isDirty: boolean) => {
        const state = get();
        set({
          openTabs: state.openTabs.map(tab => (tab.id === tabId ? { ...tab, isDirty } : tab)),
        });
      },

      clearTabsForRepo: (repoId: string) => {
        const state = get();
        const filteredTabs = state.openTabs.filter(tab => !tab.id.startsWith(`${repoId}/`));
        set({ openTabs: filteredTabs });
      },

      keepOnlyCurrentRepoTabs: (repoId: string) => {
        const state = get();
        const currentRepoTabs = state.openTabs.filter(tab => tab.id.startsWith(`${repoId}/`));

        if (currentRepoTabs.length !== state.openTabs.length) {
          // 활성 탭이 정리되었다면 현재 레포의 첫 번째 탭을 활성화
          if (currentRepoTabs.length > 0 && !currentRepoTabs.some(tab => tab.isActive)) {
            currentRepoTabs[0].isActive = true;
          }

          console.log(
            `다른 레포 탭 ${state.openTabs.length - currentRepoTabs.length}개 정리, 현재 레포 탭 ${currentRepoTabs.length}개 유지`
          );
          set({ openTabs: currentRepoTabs });
        }
      },
    }),
    {
      name: 'tab-storage',
      storage: createJSONStorage(() => localStorage),

      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('탭 상태 복원 실패:', error);
        } else if (state) {
          console.log('탭 상태 복원 완료:', state.openTabs.length, '개 탭');

          // 복원된 탭 중 활성 탭이 없으면 첫 번째를 활성화
          if (state.openTabs.length > 0 && !state.openTabs.some(tab => tab.isActive)) {
            state.openTabs[0].isActive = true;
          }

          // 하이드레이션 완료 표시
          state.setHasHydrated(true);
        }
      },

      partialize: state => ({
        openTabs: state.openTabs,
      }),
    }
  )
);

// 하이드레이션 상태를 확인하는 커스텀 훅
export const useTabStoreHydrated = () => {
  const hasHydrated = useTabStore(state => state._hasHydrated);
  const openTabs = useTabStore(state => state.openTabs);
  const setOpenTabs = useTabStore(state => state.setOpenTabs);
  const addTab = useTabStore(state => state.addTab);
  const closeTab = useTabStore(state => state.closeTab);
  const activateTab = useTabStore(state => state.activateTab);
  const openFileByPath = useTabStore(state => state.openFileByPath);
  const setTabContent = useTabStore(state => state.setTabContent);
  const setTabDirty = useTabStore(state => state.setTabDirty);
  const clearTabsForRepo = useTabStore(state => state.clearTabsForRepo);
  const keepOnlyCurrentRepoTabs = useTabStore(state => state.keepOnlyCurrentRepoTabs);

  return {
    hasHydrated,
    openTabs,
    setOpenTabs,
    addTab,
    closeTab,
    activateTab,
    openFileByPath,
    setTabContent,
    setTabDirty,
    clearTabsForRepo,
    keepOnlyCurrentRepoTabs,
  };
};
