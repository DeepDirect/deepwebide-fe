import { create } from 'zustand';
import type { OpenTab } from '@/types/repo.types';
import { repoMockData } from '@/mocks/repoMockData';

interface TabStore {
  openTabs: OpenTab[];
  setOpenTabs: (tabs: OpenTab[]) => void;
  addTab: (tab: OpenTab) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  openFileByPath: (repoId: string, filePath: string) => void;
}
export const useTabStore = create<TabStore>((set, get) => ({
  openTabs: [],

  setOpenTabs: tabs => set({ openTabs: tabs }),

  addTab: tab => {
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

  closeTab: id => {
    const state = get();
    const updatedTabs = state.openTabs.filter(tab => tab.id !== id);

    if (updatedTabs.length > 0 && !updatedTabs.some(tab => tab.isActive)) {
      updatedTabs[updatedTabs.length - 1].isActive = true;
    }

    set({ openTabs: updatedTabs });
  },

  activateTab: id => {
    const state = get();
    set({
      openTabs: state.openTabs.map(tab => ({
        ...tab,
        isActive: tab.id === id,
      })),
    });
  },

  openFileByPath: (repoId, filePath) => {
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
      // 새 탭 생성
      const fileName = filePath.includes('/') ? filePath.split('/').pop() || 'untitled' : filePath;

      const content =
        (repoMockData.fileContents as Record<string, string>)[filePath] ||
        `// ${filePath}\n// 파일 내용이 여기에 표시됩니다.`;

      const newTab: OpenTab = {
        id: tabId,
        name: fileName,
        path: filePath,
        isActive: true,
        isDirty: false,
        content,
      };

      set({
        openTabs: [...state.openTabs.map(t => ({ ...t, isActive: false })), newTab],
      });
    }
  },
}));
