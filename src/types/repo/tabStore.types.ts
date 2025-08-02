import type { OpenTab } from './repo.types';

export interface TabStore {
  openTabs: OpenTab[];
  _hasHydrated: boolean;

  setHasHydrated: (hasHydrated: boolean) => void;
  setOpenTabs: (tabs: OpenTab[]) => void;
  addTab: (tab: OpenTab) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  openFileByPath: (repoId: string, filePath: string, fileName?: string, fileId?: number) => void;
  setTabContent: (tabId: string, content: string) => void;
  setTabContentFromFile: (tabId: string, content: string) => void;
  setTabDirty: (tabId: string, isDirty: boolean) => void;
  setTabLoading: (tabId: string, isLoading: boolean) => void;
  clearTabsForRepo: (repoId: string) => void;
  clearAllTabs: () => void;
  keepOnlyCurrentRepoTabs: (repoId: string) => void;
  updateTabFromFileTree: (fileId: number, fileName: string, path: string) => void;
  markTabAsDeleted: (fileId: number) => void;
  syncTabsWithFileTree: (
    fileTreeNodes: Array<{ fileId: number; fileName: string; path: string }>
  ) => void;
  getTabById: (tabId: string) => OpenTab | undefined;
  getActiveTab: () => OpenTab | undefined;
  getDirtyTabs: () => OpenTab[];
  getTabsByRepo: (repoId: string) => OpenTab[];
}
