import { useRef, useEffect, useCallback } from 'react';
import type { OnMount } from '@monaco-editor/react';
import { getMonacoGlobal, disableLanguageDiagnostics } from '@/utils/monacoUtils';
import { useThemeStore } from '@/stores/themeStore';
import { useFileSave } from './useFileSave';
import { useTabStore } from '@/stores/tabStore';
import type { MonacoEditorInstance, MonacoTextModel, MonacoAction } from '@/types/repo/yjs.types';

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

  // 파일 저장 훅
  const { saveCurrentFile, autoSaveFile, isSaving } = useFileSave({
    repositoryId,
    enabled: !enableCollaboration,
  });

  // 안전한 Monaco 메서드 호출을 위한 헬퍼 함수
  const safelyCallEditorMethod = useCallback(
    <T>(methodName: string, defaultValue: T, ...args: unknown[]): T => {
      const editor = editorRef.current;
      if (!editor) return defaultValue;

      try {
        const method = (editor as Record<string, unknown>)[methodName];
        if (typeof method === 'function') {
          return (method as (...args: unknown[]) => T).apply(editor, args);
        }
      } catch (error) {
        console.warn(`Monaco Editor 메서드 ${methodName} 호출 실패:`, error);
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

        // 타입 안전한 에디터 메서드 호출을 위한 헬퍼
        const callEditorMethod = <T>(
          methodName: string,
          defaultValue: T,
          ...args: unknown[]
        ): T => {
          try {
            const method = (monacoEditor as Record<string, unknown>)[methodName];
            if (typeof method === 'function') {
              return (method as (...args: unknown[]) => T).apply(monacoEditor, args);
            }
          } catch (error) {
            console.warn(`Monaco Editor 메서드 ${methodName} 호출 실패:`, error);
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
            console.log('파일 저장 요청됨');
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
      } catch (error) {
        console.warn('키보드 단축키 설정 실패:', error);
      }
    },
    [saveCurrentFile]
  );

  // 에디터 마운트 핸들러
  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      // 타입 안전한 방식으로 에디터 설정
      editorRef.current = editor as unknown as MonacoEditorInstance;
      monacoEditorRef.current = editor as unknown as MonacoEditorInstance;

      // 테마 적용 함수
      const applyTheme = () => {
        const currentTheme = isDarkMode ? 'vs-dark' : 'vs';

        try {
          (monaco as { editor: { setTheme: (theme: string) => void } }).editor.setTheme(
            currentTheme
          );
          console.log('Monaco 테마 적용:', currentTheme);
        } catch (error) {
          console.warn('초기 Monaco 테마 설정 실패:', error);
        }
      };

      // 즉시 테마 적용
      applyTheme();

      // 100ms 후 한번 더 확실히 적용 (탭 정리 후 테마 문제 해결)
      setTimeout(applyTheme, 100);

      // 에디터 컨테이너 참조 저장
      try {
        const editorElement = safelyCallEditorMethod<HTMLElement | null>('getDomNode', null);
        if (editorElement?.parentElement) {
          editorContainerRef.current = editorElement.parentElement as HTMLDivElement;
        }
      } catch (error) {
        console.warn('에디터 컨테이너 참조 설정 실패:', error);
      }

      // 키보드 단축키 설정
      setupKeyboardShortcuts(editor as unknown as MonacoEditorInstance, monaco);

      // 언어별 진단 설정
      disableLanguageDiagnostics(monaco, language);

      // 포커스
      try {
        (editor as { focus: () => void }).focus();
      } catch (error) {
        console.warn('에디터 포커스 설정 실패:', error);
      }
    },
    [language, isDarkMode, setupKeyboardShortcuts, safelyCallEditorMethod]
  );

  // 에디터 내용 변경 핸들러
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

          // 협업 모드가 아닐 때만 자동 저장
          if (!enableCollaboration) {
            autoSaveFile(activeTabId, value);
          }
        }
      }
    },
    [onContentChange, setTabDirty, autoSaveFile, enableCollaboration]
  );

  // 언어별 진단 설정 - 언어가 변경될 때만 실행
  useEffect(() => {
    const monaco = getMonacoGlobal();
    if (!monaco || !editorRef.current) return;

    console.log('언어별 진단 설정:', language);
    disableLanguageDiagnostics(monaco, language);

    // Markdown의 경우 마커 제거 (성능 최적화: 500ms 간격)
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
            } catch (error) {
              console.warn(`마커 제거 실패 (${owner}):`, error);
            }
          });
        }
      };

      clearMarkers();
      const interval = setInterval(clearMarkers, 500); // 100ms → 500ms로 최적화
      return () => clearInterval(interval);
    }

    return undefined;
  }, [language, safelyCallEditorMethod]);

  // 테마 변경 감지 및 적용 - 실제 테마가 변경될 때만 실행
  useEffect(() => {
    const monaco = getMonacoGlobal();
    if (!monaco || !editorRef.current) return;

    const newTheme = isDarkMode ? 'vs-dark' : 'vs';

    try {
      monaco.editor.setTheme(newTheme);
      safelyCallEditorMethod('updateOptions', undefined, { theme: newTheme });
      console.log('실시간 테마 변경:', newTheme);
    } catch (error) {
      console.warn('Monaco 테마 적용 실패:', error);
    }
  }, [isDarkMode, safelyCallEditorMethod]);

  return {
    editorRef,
    monacoEditorRef,
    editorContainerRef,
    handleEditorDidMount,
    handleEditorChange,
    isSaving,
  };
};
