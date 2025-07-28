import { useRef, useEffect, useCallback } from 'react';
import type { OnMount } from '@monaco-editor/react';
import type { MonacoEditorInstance, MonacoModel, MonacoAction } from '@/types/monaco.types';
import { getMonacoGlobal, disableLanguageDiagnostics } from '@/utils/monacoUtils';

interface UseMonacoEditorProps {
  language: string;
  onSave: () => void;
  onContentChange?: (content: string) => void;
  enableCollaboration?: boolean;
}

interface UseMonacoEditorReturn {
  editorRef: React.RefObject<MonacoEditorInstance | null>;
  monacoEditorRef: React.RefObject<MonacoEditorInstance | null>;
  editorContainerRef: React.RefObject<HTMLDivElement | null>;
  handleEditorDidMount: OnMount;
  handleEditorChange: (value: string | undefined) => void;
}

export const useMonacoEditor = ({
  language,
  onSave,
  onContentChange,
  enableCollaboration = false,
}: UseMonacoEditorProps): UseMonacoEditorReturn => {
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const monacoEditorRef = useRef<MonacoEditorInstance | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  // 언어별 진단 설정
  useEffect(() => {
    const monaco = getMonacoGlobal();
    if (!monaco || !editorRef.current) return;

    disableLanguageDiagnostics(monaco, language);

    // Markdown의 경우 마커 제거
    if (language === 'markdown') {
      const clearMarkers = () => {
        if (editorRef.current) {
          const model = (
            editorRef.current as MonacoEditorInstance & { getModel(): MonacoModel | null }
          ).getModel();
          if (model) {
            const owners = ['typescript', 'javascript', 'css', 'json'];
            owners.forEach(owner => {
              monaco.editor.setModelMarkers(model, owner, []);
            });
          }
        }
      };
      clearMarkers();

      const interval = setInterval(clearMarkers, 100);
      return () => clearInterval(interval);
    }
  }, [language]);

  // 에디터 마운트 핸들러
  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoEditorRef.current = editor;

      // 에디터 컨테이너 참조 저장
      const editorElement = editor.getDomNode();
      if (editorElement?.parentElement) {
        editorContainerRef.current = editorElement.parentElement as HTMLDivElement;
      }

      // 타입 확장을 위한 인터페이스
      const editorWithMethods = editor as MonacoEditorInstance & {
        addCommand(keybinding: number, handler: () => void): void;
        getAction(actionId: string): MonacoAction | null;
        getModel(): MonacoModel | null;
        setSelection(range: {
          startLineNumber: number;
          startColumn: number;
          endLineNumber: number;
          endColumn: number;
        }): void;
      };

      // 키보드 단축키 설정
      // Ctrl+S: 저장
      editorWithMethods.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave();
        console.log('파일 저장됨');
      });

      // Alt+Shift+F: 포맷팅
      editorWithMethods.addCommand(
        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        () => {
          const formatAction = editorWithMethods.getAction('editor.action.formatDocument');
          if (formatAction) {
            formatAction.run();
          }
        }
      );

      // Ctrl+A: 전체 선택
      editorWithMethods.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {
        const model = editorWithMethods.getModel();
        if (model) {
          const fullRange = model.getFullModelRange();
          editorWithMethods.setSelection(fullRange);
        }
      });

      // 언어별 진단 설정
      disableLanguageDiagnostics(monaco, language);

      // 포커스
      editor.focus();
    },
    [language, onSave]
  );

  // 에디터 내용 변경 핸들러
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && !enableCollaboration && onContentChange) {
        onContentChange(value);
      }
    },
    [enableCollaboration, onContentChange]
  );

  return {
    editorRef,
    monacoEditorRef,
    editorContainerRef,
    handleEditorDidMount,
    handleEditorChange,
  };
};
