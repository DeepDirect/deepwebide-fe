import { create } from 'zustand';

interface FileSectionState {
  isVisible: boolean;
  toggleVisibility: () => void;
  setVisibility: (visible: boolean) => void;
}

export const useFileSectionStore = create<FileSectionState>(set => ({
  isVisible: true,
  toggleVisibility: () => set(state => ({ isVisible: !state.isVisible })),
  setVisibility: (visible: boolean) => set({ isVisible: visible }),
}));
