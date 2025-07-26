import React, { useRef, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { useYjsCollaboration } from '@/hooks/useYjsCollaboration';
import { useEditorStore } from '@/stores/editorStore';
import { useTabStore } from '@/stores/tabStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { getLanguageFromFile } from '@/utils/fileExtensions';
import CursorOverlay from './CursorOverlay';
import styles from './MonacoCollaborativeEditor.module.scss';

interface MonacoCollaborativeEditorProps {
  repoId: string;
  enableCollaboration?: boolean;
  userId?: string;
  userName?: string;
}

// 타입 정의
interface MonacoEditorInstance {
  getScrolledVisiblePosition(position: { lineNumber: number; column: number }): {
    left: number;
    top: number;
  } | null;
  getOption(optionId: number): unknown;
  onDidScrollChange(callback: () => void): { dispose(): void } | null;
  onDidLayoutChange(callback: () => void): { dispose(): void } | null;
  getScrollTop(): number;
  getScrollLeft(): number;
  getDomNode(): HTMLElement;
  getModel(): TextModel | null;
  addCommand(keybinding: number, handler: () => void): void;
  getAction(actionId: string): MonacoAction | null;
  setSelection(range: MonacoRange): void;
  focus(): void;
}

interface EditorInstance {
  getModel(): TextModel | null;
  onDidChangeCursorPosition(callback: (event: CursorChangeEvent) => void): unknown;
  onDidChangeCursorSelection(callback: (event: SelectionChangeEvent) => void): unknown;
  addCommand(keybinding: number, handler: () => void): void;
  getAction(actionId: string): MonacoAction | null;
  setSelection(range: MonacoRange): void;
  focus(): void;
  getDomNode(): HTMLElement;
}

interface TextModel {
  uri: unknown;
  getValue(): string;
  setValue(value: string): void;
  getFullModelRange(): MonacoRange;
}

interface MonacoRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

interface MonacoAction {
  run(): void;
}

interface CursorChangeEvent {
  position: {
    lineNumber: number;
    column: number;
  };
}

interface SelectionChangeEvent {
  selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

interface MonacoGlobal {
  editor: {
    setModelMarkers: (model: unknown, owner: string, markers: unknown[]) => void;
  };
  languages: {
    typescript: {
      typescriptDefaults: {
        setDiagnosticsOptions: (options: Record<string, boolean>) => void;
      };
      javascriptDefaults: {
        setDiagnosticsOptions: (options: Record<string, boolean>) => void;
      };
    };
    css: {
      cssDefaults: {
        setOptions: (options: { validate: boolean }) => void;
      };
    };
    json: {
      jsonDefaults: {
        setDiagnosticsOptions: (options: { validate: boolean }) => void;
      };
    };
  };
  KeyMod: Record<string, number>;
  KeyCode: Record<string, number>;
}

const MonacoCollaborativeEditor: React.FC<MonacoCollaborativeEditorProps> = ({
  repoId,
  enableCollaboration = true,
  userId = `user-${Date.now()}`,
  userName = 'Anonymous',
}) => {
  const editorRef = useRef<EditorInstance | null>(null);
  const monacoEditorRef = useRef<MonacoEditorInstance | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  const { updateContent, saveContent } = useEditorStore();
  const { openTabs } = useTabStore();
  const { users } = useCollaborationStore();

  const activeTab = openTabs.find(tab => tab.isActive);
  const language = activeTab ? getLanguageFromFile(activeTab.name) : 'plaintext';
  const roomId = activeTab && enableCollaboration ? `${repoId}-${activeTab.path}` : '';

  const { isConnected, isLoading } = useYjsCollaboration({
    roomId,
    editor: editorRef.current,
    userId,
    userName,
    enabled: enableCollaboration && Boolean(activeTab),
  });

  // 언어별 진단 설정
  useEffect(() => {
    const monacoGlobal = (window as typeof window & { monaco?: MonacoGlobal }).monaco;

    if (monacoGlobal) {
      const disableDiagnostics = language === 'markdown';

      monacoGlobal.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: disableDiagnostics,
        noSyntaxValidation: disableDiagnostics,
        noSuggestionDiagnostics: disableDiagnostics,
      });

      monacoGlobal.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: disableDiagnostics,
        noSyntaxValidation: disableDiagnostics,
        noSuggestionDiagnostics: disableDiagnostics,
      });

      monacoGlobal.languages.css.cssDefaults.setOptions({
        validate: !disableDiagnostics,
      });

      monacoGlobal.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: !disableDiagnostics,
      });

      if (disableDiagnostics && editorRef.current) {
        const editor = editorRef.current as { getModel(): { uri: unknown } | null };

        const clearAllMarkers = () => {
          const model = editor.getModel();
          if (model) {
            const owners = ['typescript', 'javascript', 'css', 'json'];
            owners.forEach(owner => {
              monacoGlobal.editor.setModelMarkers(model, owner, []);
            });
          }
        };

        clearAllMarkers();
        const interval = setInterval(clearAllMarkers, 100);

        return () => {
          clearInterval(interval);
        };
      }
    }
  }, [language, activeTab?.path]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor as unknown as EditorInstance;
    monacoEditorRef.current = editor as unknown as MonacoEditorInstance;

    // 에디터 컨테이너 참조 저장
    const editorElement = editor.getDomNode();
    if (editorElement?.parentElement) {
      editorContainerRef.current = editorElement.parentElement as HTMLDivElement;
    }

    // 키보드 단축키 설정
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveContent();
      console.log('파일 저장됨');
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      const formatAction = editor.getAction('editor.action.formatDocument');
      if (formatAction) {
        formatAction.run();
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {
      const model = editor.getModel();
      if (model) {
        const fullRange = model.getFullModelRange();
        editor.setSelection(fullRange);
      }
    });

    editor.focus();

    // Markdown 진단 설정
    if (language === 'markdown') {
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true,
      });

      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true,
      });

      monaco.languages.css.cssDefaults.setOptions({
        validate: false,
      });

      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: false,
      });
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && !enableCollaboration) {
      updateContent(value);
    }
  };

  if (!activeTab) {
    return (
      <div className={styles.editorPlaceholder}>
        <div className={styles.placeholderContent}>
          <div className={styles.placeholderIcon}>📄</div>
          <h3>파일을 선택해주세요</h3>
          <p>파일을 선택하면 에디터가 시작됩니다.</p>
          {enableCollaboration && (
            <p className={styles.collaborationNote}>
              🤝 협업 모드 {isConnected ? '연결됨' : isLoading ? '연결 중...' : '연결 끊김'}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.collaborativeEditor}>
      {/* 협업 상태 표시 */}
      {enableCollaboration && isConnected && (
        <div className={styles.collaborationStatus}>
          <span>이 파일에 위치하고 있는 사람 : ({users.length + 1}명)</span>
        </div>
      )}

      <div className={styles.editorContainer} ref={editorContainerRef}>
        <Editor
          height="100%"
          language={language}
          value={enableCollaboration ? undefined : activeTab.content}
          theme="vs"
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={
            <div className={styles.editorLoading}>
              <div className={styles.loadingSpinner} />
              <span>에디터 로딩 중...</span>
            </div>
          }
          options={{
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Consolas", monospace',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            minimap: { enabled: true, side: 'right' },
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: true,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            cursorStyle: 'line',
            cursorWidth: 2,
            selectOnLineNumbers: true,
            selectionHighlight: true,
            occurrencesHighlight: 'singleFile',
            smoothScrolling: true,
            quickSuggestions: language !== 'markdown',
            suggestOnTriggerCharacters: language !== 'markdown',
            acceptSuggestionOnEnter: language !== 'markdown' ? 'on' : 'off',
            folding: true,
            showFoldingControls: 'always',
            links: true,
            colorDecorators: true,
            contextmenu: true,
            readOnly: false,
            hover: { enabled: language !== 'markdown' },
            parameterHints: { enabled: language !== 'markdown' },
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 13,
              horizontalScrollbarSize: 13,
            },
          }}
        />

        {/* 커서 오버레이 */}
        {enableCollaboration && isConnected && (
          <CursorOverlay
            editorContainer={editorContainerRef.current}
            monacoEditor={monacoEditorRef.current}
          />
        )}
      </div>
    </div>
  );
};

export default MonacoCollaborativeEditor;
