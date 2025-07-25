import type { RepoLanguageConfig } from '@/types/editor.types';

export const SUPPORTED_LANGUAGES = {
  SPRING_BOOT: 'spring-boot',
  REACT: 'react',
  FASTAPI: 'fastapi',
} as const;

export const LANGUAGE_CONFIGS: Record<string, RepoLanguageConfig> = {
  [SUPPORTED_LANGUAGES.SPRING_BOOT]: {
    language: 'spring-boot',
    id: 'java',
    monacoLanguage: 'java',
    fileExtensions: ['.java', '.xml', '.properties', '.yaml', '.yml'],
    defaultTheme: 'vs-dark',
    snippets: ['sysout', 'psvm', 'fori'],
  },
  [SUPPORTED_LANGUAGES.REACT]: {
    language: 'react',
    id: 'typescript',
    monacoLanguage: 'typescript',
    fileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss'],
    defaultTheme: 'vs-dark',
    snippets: ['rfc', 'useState', 'useEffect'],
  },
  [SUPPORTED_LANGUAGES.FASTAPI]: {
    language: 'fastapi',
    id: 'python',
    monacoLanguage: 'python',
    fileExtensions: ['.py', '.pyi', '.pyx', '.requirements.txt'],
    defaultTheme: 'vs-dark',
    snippets: ['def', 'class', 'if', 'for'],
  },
};
