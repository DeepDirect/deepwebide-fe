import { useTabStore } from '@/stores/tabStore';
import type { OpenTab } from '@/types/repo/repo.types';

// 하이드레이션을 포함한 메인 훅
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

// 편의성 훅들
export const useActiveTab = (): OpenTab | undefined => {
  return useTabStore(state => state.openTabs.find(tab => tab.isActive));
};

export const useTabsByRepo = (repoId: string): OpenTab[] => {
  return useTabStore(state => state.openTabs.filter(tab => tab.id.startsWith(`${repoId}/`)));
};

export const useDirtyTabs = (): OpenTab[] => {
  return useTabStore(state => state.openTabs.filter(tab => tab.isDirty));
};

export const useTabByPath = (repoId: string, filePath: string): OpenTab | undefined => {
  const tabId = `${repoId}/${filePath}`;
  return useTabStore(state => state.openTabs.find(tab => tab.id === tabId));
};

export const useTabCount = (): number => {
  return useTabStore(state => state.openTabs.length);
};

export const useIsHydrated = (): boolean => {
  return useTabStore(state => state._hasHydrated);
};
