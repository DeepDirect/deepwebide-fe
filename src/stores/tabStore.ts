import { create } from 'zustand';
import type { OpenTab } from '@/types/repo.types';

interface TabStore {
  openTabs: OpenTab[];
  setOpenTabs: (tabs: OpenTab[]) => void;
  addTab: (tab: OpenTab) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
}

export const useTabStore = create<TabStore>(set => ({
  openTabs: [],

  setOpenTabs: tabs => set({ openTabs: tabs }),

  addTab: tab =>
    set(state => {
      const exists = state.openTabs.some(t => t.id === tab.id);
      if (exists) return state;
      return {
        openTabs: [
          ...state.openTabs.map(t => ({ ...t, isActive: false })),
          { ...tab, isActive: true },
        ],
      };
    }),

  closeTab: id =>
    set(state => {
      const updatedTabs = state.openTabs.filter(tab => tab.id !== id);
      if (updatedTabs.length > 0 && !updatedTabs.some(tab => tab.isActive)) {
        updatedTabs[updatedTabs.length - 1].isActive = true;
      }
      return { openTabs: updatedTabs };
    }),

  activateTab: id =>
    set(state => ({
      openTabs: state.openTabs.map(tab => ({
        ...tab,
        isActive: tab.id === id,
      })),
    })),
}));
