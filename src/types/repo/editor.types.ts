export interface EditorTab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isActive: boolean;
  isDirty: boolean;
  lastModified: Date;
}

export interface RepoLanguageConfig {
  language: 'spring-boot' | 'react' | 'fastapi';
  id: string;
  monacoLanguage: string;
  fileExtensions: string[];
  defaultTheme: string;
  snippets: string[];
}
