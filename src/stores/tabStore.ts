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

      // 파일 관련
      openFileByPath: (repoId: string, filePath: string, fileName?: string) => {
        const state = get();
        const tabId = `${repoId}/${filePath}`;
        const existingTab = state.openTabs.find(tab => tab.id === tabId);

        if (existingTab) {
          set({
            openTabs: state.openTabs.map(tab => ({
              ...tab,
              isActive: tab.id === tabId,
            })),
          });
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

      // 레포지토리 관련
      clearTabsForRepo: (repoId: string) => {
        const state = get();
        const filteredTabs = state.openTabs.filter(tab => !tab.id.startsWith(`${repoId}/`));
        set({ openTabs: filteredTabs });
      },

      keepOnlyCurrentRepoTabs: (repoId: string) => {
        const state = get();
        const currentRepoTabs = state.openTabs.filter(tab => tab.id.startsWith(`${repoId}/`));

        if (currentRepoTabs.length !== state.openTabs.length) {
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

          if (state.openTabs.length > 0 && !state.openTabs.some(tab => tab.isActive)) {
            state.openTabs[0].isActive = true;
          }

          state.setHasHydrated(true);
        }
      },

      partialize: state => ({
        openTabs: state.openTabs,
      }),
    }
  )
);
