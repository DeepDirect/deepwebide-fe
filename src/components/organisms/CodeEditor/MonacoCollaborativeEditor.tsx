import React, { useRef, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useEditorStore } from '@/stores/editorStore';
import { useTabStore } from '@/stores/tabStore';
import { getLanguageFromFile } from '@/utils/fileExtensions';
import styles from './MonacoCollaborativeEditor.module.scss';

interface MonacoCollaborativeEditorProps {
  repoId: string;
  enableCollaboration?: boolean;
  userId?: string;
  userName?: string;
}

const MonacoCollaborativeEditor: React.FC<MonacoCollaborativeEditorProps> = ({
  repoId,
  enableCollaboration = true,
  userId = `user-${Date.now()}`,
  userName = 'Anonymous',
}) => {
  const editorRef = useRef<unknown>(null);

  const { updateContent, saveContent } = useEditorStore();
  const { openTabs } = useTabStore();

  const activeTab = openTabs.find(tab => tab.isActive);
  const language = activeTab ? getLanguageFromFile(activeTab.name) : 'plaintext';
  const roomId = activeTab && enableCollaboration ? `${repoId}-${activeTab.path}` : '';

  // 탭 전환 시마다 언어별 진단 기능 설정
  useEffect(() => {
    interface MonacoGlobal {
      editor: {
        setModelMarkers: (model: unknown, owner: string, markers: unknown[]) => void;
      };
      languages: {
        typescript: {
          typescriptDefaults: {
            setDiagnosticsOptions: (options: {
              noSemanticValidation: boolean;
              noSyntaxValidation: boolean;
              noSuggestionDiagnostics: boolean;
            }) => void;
          };
          javascriptDefaults: {
            setDiagnosticsOptions: (options: {
              noSemanticValidation: boolean;
              noSyntaxValidation: boolean;
              noSuggestionDiagnostics: boolean;
            }) => void;
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
    }

    const monacoGlobal = (window as typeof window & { monaco?: MonacoGlobal }).monaco;

    if (monacoGlobal) {
      if (language === 'markdown') {
        // Markdown 파일에서만 진단 기능 비활성화
        monacoGlobal.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: true,
          noSuggestionDiagnostics: true,
        });

        monacoGlobal.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: true,
          noSuggestionDiagnostics: true,
        });

        monacoGlobal.languages.css.cssDefaults.setOptions({
          validate: false,
        });

        monacoGlobal.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: false,
        });

        // Markdown에서 기존 마커들 제거
        if (editorRef.current) {
          const editor = editorRef.current as {
            getModel(): { uri: unknown } | null;
          };

          const clearAllMarkers = () => {
            const model = editor.getModel();
            if (model) {
              monacoGlobal.editor.setModelMarkers(model, 'typescript', []);
              monacoGlobal.editor.setModelMarkers(model, 'javascript', []);
              monacoGlobal.editor.setModelMarkers(model, 'css', []);
              monacoGlobal.editor.setModelMarkers(model, 'json', []);
            }
          };

          clearAllMarkers();
          const interval = setInterval(clearAllMarkers, 100);

          return () => {
            clearInterval(interval);
          };
        }
      } else {
        // 다른 파일 타입에서는 진단 기능 활성화
        monacoGlobal.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          noSuggestionDiagnostics: false,
        });

        monacoGlobal.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          noSuggestionDiagnostics: false,
        });

        monacoGlobal.languages.css.cssDefaults.setOptions({
          validate: true,
        });

        monacoGlobal.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
        });
      }
    }
  }, [language, activeTab?.path]);

  // 삭제 예정인 레거시 useEffect 제거

  useCollaboration({
    roomId,
    editor: editorRef.current,
    userId,
    userName,
    enabled: enableCollaboration && !!activeTab,
  });

  // 에디터 마운트 시 설정
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // 키보드 단축키 설정
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveContent();
      console.log('파일 저장됨');
    });

    // 포맷팅 단축키 (Alt + Shift + F)
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      const formatAction = editor.getAction('editor.action.formatDocument');
      if (formatAction) {
        formatAction.run();
      }
    });

    // 전체 선택 단축키 (Ctrl/Cmd + A)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {
      const model = editor.getModel();
      if (model) {
        const fullRange = model.getFullModelRange();
        editor.setSelection(fullRange);
      }
    });

    editor.focus();

    // Markdown 파일인 경우에만 진단 기능 비활성화
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

  // 에디터 내용 변경 핸들러
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && !enableCollaboration) {
      updateContent(value);
    }
  };

  // 활성 탭이 없을 때 플레이스홀더 표시
  if (!activeTab) {
    return (
      <div className={styles.editorPlaceholder}>
        <div className={styles.placeholderContent}>
          <div className={styles.placeholderIcon}>📄</div>
          <h3>파일을 선택해주세요</h3>
          <p>파일을 선택하면 에디터가 시작됩니다.</p>
          {enableCollaboration && (
            <p className={styles.collaborationNote}>🤝 협업 모드가 활성화되어 있습니다</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.collaborativeEditor}>
      <div className={styles.editorContainer}>
        <Editor
          height="100%"
          language={language}
          value={activeTab.content}
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
            // 기본 설정 - 코드 에디터에 적합한 모노스페이스 폰트 유지
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Consolas", monospace',

            // 레이아웃
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,

            // 라인 설정
            lineNumbers: 'on',
            renderLineHighlight: 'all',

            // 미니맵
            minimap: {
              enabled: true,
              side: 'right',
            },

            // 들여쓰기 및 공백
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: true,
            renderWhitespace: 'selection',

            // 괄호 매칭
            bracketPairColorization: { enabled: true },

            // 커서 및 선택
            cursorStyle: 'line',
            cursorWidth: 2,
            selectOnLineNumbers: true,
            selectionHighlight: true,
            occurrencesHighlight: 'singleFile',

            // 스크롤
            smoothScrolling: true,

            // Markdown에서는 자동완성 및 진단 기능 비활성화
            quickSuggestions: language !== 'markdown',
            suggestOnTriggerCharacters: language !== 'markdown',
            acceptSuggestionOnEnter: language !== 'markdown' ? 'on' : 'off',

            // 코드 접기
            folding: true,
            showFoldingControls: 'always',

            // 기타 기능
            links: true,
            colorDecorators: true,
            contextmenu: true,
            readOnly: false,

            // IntelliSense (Markdown에서는 비활성화)
            hover: { enabled: language !== 'markdown' },
            parameterHints: { enabled: language !== 'markdown' },

            // 스크롤바
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 13,
              horizontalScrollbarSize: 13,
            },
          }}
        />
      </div>
    </div>
  );
};

export default MonacoCollaborativeEditor;
