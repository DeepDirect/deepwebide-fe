import { create } from 'zustand';

export type SidebarSectionType = 'files' | 'save' | null;

interface FileSectionState {
  isVisible: boolean;
  activeSection: SidebarSectionType;
  toggleVisibility: () => void;
  setVisibility: (visible: boolean) => void;
  setActiveSection: (section: SidebarSectionType) => void;
  toggleSection: (section: SidebarSectionType) => void;
}

export const useFileSectionStore = create<FileSectionState>(set => ({
  isVisible: true,
  activeSection: 'files',
  toggleVisibility: () => set(state => ({ isVisible: !state.isVisible })),
  setVisibility: (visible: boolean) => set({ isVisible: visible }),
  setActiveSection: (section: SidebarSectionType) =>
    set({ activeSection: section, isVisible: section !== null }),
  toggleSection: (section: SidebarSectionType) =>
    set(state => {
      if (state.activeSection === section && state.isVisible) {
        // 같은 섹션을 다시 클릭하면 닫기
        return { isVisible: false, activeSection: null };
      } else {
        // 다른 섹션이거나 닫혀있으면 해당 섹션 열기
        return { isVisible: true, activeSection: section };
      }
    }),
}));
