import { create } from 'zustand';
import type { RepoLanguageConfig } from '@/types/editor.types';
import { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGES } from '@/utils/editorLanguages';

interface EditorStore {
  repoLanguage: RepoLanguageConfig;
  currentContent: string;
  isLoading: boolean;
  hasUnsavedChanges: boolean;

  // 액션
  setRepoLanguage: (language: keyof typeof SUPPORTED_LANGUAGES) => void;
  updateContent: (content: string) => void;
  saveContent: () => void;
  resetContent: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  repoLanguage: LANGUAGE_CONFIGS[SUPPORTED_LANGUAGES.REACT], // 기본값
  currentContent: '',
  isLoading: false,
  hasUnsavedChanges: false,

  setRepoLanguage: language => {
    const languageKey = SUPPORTED_LANGUAGES[language];
    set({ repoLanguage: LANGUAGE_CONFIGS[languageKey] });
  },

  updateContent: content => {
    set({
      currentContent: content,
      hasUnsavedChanges: true,
    });
  },

  saveContent: () => {
    console.log('Content saved:', get().currentContent);
    set({ hasUnsavedChanges: false });
    // 추후 백엔드 API 호출
  },

  resetContent: () => {
    set({
      currentContent: '',
      hasUnsavedChanges: false,
    });
  },
}));
