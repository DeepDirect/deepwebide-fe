import type { OpenTab } from '@/types/repo/repo.types';

export interface TabStore {
  // 상태
  openTabs: OpenTab[];
  _hasHydrated: boolean;

  // 기본 관리
  setOpenTabs: (tabs: OpenTab[]) => void;
  addTab: (tab: OpenTab) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;

  // 파일 관련
  openFileByPath: (repoId: string, filePath: string, fileName?: string, fileId?: number) => void;
  setTabContent: (tabId: string, content: string) => void;
  setTabContentFromFile: (tabId: string, content: string) => void; // 새로 추가
  setTabDirty: (tabId: string, isDirty: boolean) => void;

  // 레포지토리 관련
  clearTabsForRepo: (repoId: string) => void;
  keepOnlyCurrentRepoTabs: (repoId: string) => void;

  // 디버그 헬퍼
  getTabById: (tabId: string) => OpenTab | undefined;
  getActiveTab: () => OpenTab | undefined;
  getDirtyTabs: () => OpenTab[];
  getTabsByRepo: (repoId: string) => OpenTab[];

  // 하이드레이션
  setHasHydrated: (hasHydrated: boolean) => void;
}
