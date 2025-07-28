import type { MonacoInstance } from '@/types/monaco.types';

// Monaco Editor 옵션 설정
export const getMonacoEditorOptions = (language: string, isDarkMode: boolean) => ({
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Consolas", monospace',
  wordWrap: 'on' as const,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  lineNumbers: 'on' as const,
  renderLineHighlight: 'all' as const,
  minimap: { enabled: true, side: 'right' as const },
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: true,
  renderWhitespace: 'selection' as const,
  bracketPairColorization: { enabled: true },
  cursorStyle: 'line' as const,
  cursorWidth: 2,
  selectOnLineNumbers: true,
  selectionHighlight: true,
  occurrencesHighlight: 'singleFile' as const,
  smoothScrolling: true,
  quickSuggestions: language !== 'markdown',
  suggestOnTriggerCharacters: language !== 'markdown',
  acceptSuggestionOnEnter: language !== 'markdown' ? ('on' as const) : ('off' as const),
  folding: true,
  showFoldingControls: 'always' as const,
  links: true,
  colorDecorators: true,
  contextmenu: true,
  readOnly: false,
  hover: { enabled: language !== 'markdown' },
  parameterHints: { enabled: language !== 'markdown' },
  scrollbar: {
    vertical: 'visible' as const,
    horizontal: 'visible' as const,
    verticalScrollbarSize: 13,
    horizontalScrollbarSize: 13,
  },
  theme: isDarkMode ? 'vs-dark' : 'vs',
});

// 언어별 진단 설정 비활성화
export const disableLanguageDiagnostics = (monaco: MonacoInstance, language: string): void => {
  const shouldDisable = language === 'markdown';

  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: shouldDisable,
    noSyntaxValidation: shouldDisable,
    noSuggestionDiagnostics: shouldDisable,
  });

  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: shouldDisable,
    noSyntaxValidation: shouldDisable,
    noSuggestionDiagnostics: shouldDisable,
  });

  monaco.languages.css.cssDefaults.setOptions({
    validate: !shouldDisable,
  });

  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: !shouldDisable,
  });
};

// Monaco 전역 객체 가져오기
export const getMonacoGlobal = (): MonacoInstance | null => {
  const windowWithMonaco = window as typeof window & { monaco?: MonacoInstance };
  return windowWithMonaco.monaco || null;
};
