import { create } from 'zustand';

interface RepoSettingsInfo {
  repositoryId: number;
  repositoryName: string;
  createdAt: string;
  updatedAt: string;
  shareLink: string | null;
  members: Array<{
    userId: number;
    nickname: string;
    profileImageUrl: string;
    role: 'OWNER' | 'MEMBER';
  }>;
  isShared: boolean;
}

const useRepoSettingsStore = create<{
  settingsData: RepoSettingsInfo | null;

  setSettingsData: (data: RepoSettingsInfo | null) => void;
}>(set => ({
  settingsData: null,

  setSettingsData: (data: RepoSettingsInfo | null) => set({ settingsData: data }),
}));

export default useRepoSettingsStore;
