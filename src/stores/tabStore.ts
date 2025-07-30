import { create } from 'zustand';
import type { OpenTab } from '@/types/repo/repo.types';

interface TabStore {
  openTabs: OpenTab[];
  setOpenTabs: (tabs: OpenTab[]) => void;
  addTab: (tab: OpenTab) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  openFileByPath: (repoId: string, filePath: string, fileName?: string) => void;
  setTabContent: (tabId: string, content: string) => void;
  setTabDirty: (tabId: string, isDirty: boolean) => void;
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

  openFileByPath: (repoId, filePath, fileName) => {
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
        fileName || (filePath.includes('/') ? filePath.split('/').pop() || 'untitled' : filePath);

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

  setTabContent: (tabId, content) => {
    const state = get();
    set({
      openTabs: state.openTabs.map(tab => (tab.id === tabId ? { ...tab, content } : tab)),
    });
  },

  setTabDirty: (tabId, isDirty) => {
    const state = get();
    set({
      openTabs: state.openTabs.map(tab => (tab.id === tabId ? { ...tab, isDirty } : tab)),
    });
  },
}));
