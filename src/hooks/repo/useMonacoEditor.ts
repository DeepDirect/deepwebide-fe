import { useRef, useEffect, useCallback } from 'react';
import type { OnMount } from '@monaco-editor/react';
import { getMonacoGlobal, disableLanguageDiagnostics } from '@/utils/monacoUtils';
import { useThemeStore } from '@/stores/themeStore';
import { useFileSave } from './useFileSave';
import { useTabStore } from '@/stores/tabStore';
import type { MonacoEditorInstance, MonacoAction } from '@/types/repo/monaco.types';

// MonacoTextModel 인터페이스 정의
interface MonacoTextModel {
  getValue(): string;
  setValue(value: string): void;
  getFullModelRange?: () => {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

interface UseMonacoEditorProps {
  language: string;
  repositoryId: number;
  onContentChange?: (content: string) => void;
  enableCollaboration?: boolean;
}

interface UseMonacoEditorReturn {
  editorRef: React.RefObject<MonacoEditorInstance | null>;
  monacoEditorRef: React.RefObject<MonacoEditorInstance | null>;
  editorContainerRef: React.RefObject<HTMLDivElement | null>;
  handleEditorDidMount: OnMount;
  handleEditorChange: (value: string | undefined, activeTabId?: string) => void;
  isSaving: boolean;
}

export const useMonacoEditor = ({
  language,
  repositoryId,
  onContentChange,
  enableCollaboration = false,
}: UseMonacoEditorProps): UseMonacoEditorReturn => {
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const monacoEditorRef = useRef<MonacoEditorInstance | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const { isDarkMode } = useThemeStore();
  const { setTabDirty } = useTabStore();

  // 협업 모드에서도 저장 기능 활성화
  const { saveCurrentFile, autoSaveFile, isSaving } = useFileSave({
    repositoryId,
    enabled: true,
    collaborationMode: enableCollaboration,
  });

  // 안전한 Monaco 메서드 호출을 위한 헬퍼 함수
  const safelyCallEditorMethod = useCallback(
    <T>(methodName: string, defaultValue: T, ...args: unknown[]): T => {
      const editor = editorRef.current;
      if (!editor) return defaultValue;

      try {
        const method = (editor as unknown as Record<string, unknown>)[methodName];
        if (typeof method === 'function') {
          return (method as (...args: unknown[]) => T).apply(editor, args);
        }
      } catch {
        // 에러 로그 제거
      }

      return defaultValue;
    },
    []
  );

  // 키보드 단축키 설정
  const setupKeyboardShortcuts = useCallback(
    (monacoEditor: MonacoEditorInstance, monaco: unknown) => {
      try {
        const monacoObj = monaco as {
          KeyMod: { CtrlCmd: number; Alt: number; Shift: number };
          KeyCode: { KeyS: number; KeyF: number; KeyA: number };
        };

        const callEditorMethod = <T>(
          methodName: string,
          defaultValue: T,
          ...args: unknown[]
        ): T => {
          try {
            const method = (monacoEditor as unknown as Record<string, unknown>)[methodName];
            if (typeof method === 'function') {
              return (method as (...args: unknown[]) => T).apply(monacoEditor, args);
            }
          } catch {
            // 에러 로그 제거
          }
          return defaultValue;
        };

        // Ctrl+S: 저장
        callEditorMethod(
          'addCommand',
          undefined,
          monacoObj.KeyMod.CtrlCmd | monacoObj.KeyCode.KeyS,
          () => {
            saveCurrentFile();
          }
        );

        // Alt+Shift+F: 포맷팅
        callEditorMethod(
          'addCommand',
          undefined,
          monacoObj.KeyMod.Alt | monacoObj.KeyMod.Shift | monacoObj.KeyCode.KeyF,
          () => {
            const formatAction = callEditorMethod<MonacoAction | null>(
              'getAction',
              null,
              'editor.action.formatDocument'
            );
            if (formatAction) {
              formatAction.run();
            }
          }
        );

        // Ctrl+A: 전체 선택
        callEditorMethod(
          'addCommand',
          undefined,
          monacoObj.KeyMod.CtrlCmd | monacoObj.KeyCode.KeyA,
          () => {
            const model = callEditorMethod<MonacoTextModel | null>('getModel', null);
            if (model && model.getFullModelRange) {
              const fullRange = model.getFullModelRange();
              callEditorMethod('setSelection', undefined, fullRange);
            }
          }
        );
      } catch {
        // 에러 로그 제거
      }
    },
    [saveCurrentFile]
  );

  // 에디터 마운트 핸들러
  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor as unknown as MonacoEditorInstance;
      monacoEditorRef.current = editor as unknown as MonacoEditorInstance;

      const applyTheme = () => {
        const currentTheme = isDarkMode ? 'vs-dark' : 'vs';
        try {
          (monaco as { editor: { setTheme: (theme: string) => void } }).editor.setTheme(
            currentTheme
          );
        } catch {
          // 테마 설정 실패 로그 제거
        }
      };

      applyTheme();
      setupKeyboardShortcuts(editorRef.current, monaco);
    },
    [isDarkMode, setupKeyboardShortcuts]
  );

  // 에디터 변경 핸들러 - 타이머 중복 방지
  const handleEditorChange = useCallback(
    (value: string | undefined, activeTabId?: string) => {
      if (value !== undefined) {
        // 기본 콘텐츠 변경 콜백 호출
        if (onContentChange) {
          onContentChange(value);
        }

        // 탭을 dirty 상태로 설정
        if (activeTabId) {
          setTabDirty(activeTabId, true);

          // autoSaveFile의 내부 로직만 사용 (추가 타이머 생성하지 않음)
          autoSaveFile(activeTabId, value);
        }
      }
    },
    [onContentChange, setTabDirty, autoSaveFile]
  );

  // 언어별 진단 설정
  useEffect(() => {
    const monaco = getMonacoGlobal();
    if (!monaco || !editorRef.current) return;

    disableLanguageDiagnostics(monaco, language);

    // Markdown의 경우 마커 제거
    if (language === 'markdown') {
      const clearMarkers = () => {
        const editor = editorRef.current;
        if (!editor) return;

        const model = safelyCallEditorMethod<MonacoTextModel | null>('getModel', null);
        if (model) {
          const owners = ['typescript', 'javascript', 'css', 'json'];
          owners.forEach(owner => {
            try {
              const monaco = getMonacoGlobal();
              if (monaco) {
                monaco.editor.setModelMarkers(model as never, owner, []);
              }
            } catch {
              // 마커 제거 실패 로그 제거
            }
          });
        }
      };

      clearMarkers();
      const interval = setInterval(clearMarkers, 500);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [language, safelyCallEditorMethod]);

  // 테마 변경 감지 및 적용
  useEffect(() => {
    const monaco = getMonacoGlobal();
    if (!monaco || !editorRef.current) return;

    const newTheme = isDarkMode ? 'vs-dark' : 'vs';
    try {
      (monaco as { editor: { setTheme: (theme: string) => void } }).editor.setTheme(newTheme);
    } catch {
      // 테마 설정 실패 로그 제거
    }
  }, [isDarkMode]);

  return {
    editorRef,
    monacoEditorRef,
    editorContainerRef,
    handleEditorDidMount,
    handleEditorChange,
    isSaving,
  };
};
