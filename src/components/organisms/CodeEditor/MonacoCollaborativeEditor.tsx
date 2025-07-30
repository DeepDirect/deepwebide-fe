import React from 'react';
import { Editor } from '@monaco-editor/react';
import { useYjsCollaboration } from '@/hooks/repo/useYjsCollaboration';
import { useMonacoEditor } from '@/hooks/repo/useMonacoEditor';
import { useEditorStore } from '@/stores/editorStore';
import { useTabStore } from '@/stores/tabStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useThemeStore } from '@/stores/themeStore';
import { getLanguageFromFile } from '@/utils/fileExtensions';
import { getMonacoEditorOptions } from '@/utils/monacoUtils';
import CursorOverlay from '@/components/organisms/CursorOverlay/CursorOverlay';
import CollaborationStatus from '@/components/molecules/CollaborationStatus/CollaborationStatus';
import EditorPlaceholder from './EditorPlaceholder';
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
  const { updateContent, saveContent } = useEditorStore();
  const { openTabs } = useTabStore();
  const { users } = useCollaborationStore();
  const { isDarkMode } = useThemeStore();

  // 활성 탭 정보
  const activeTab = openTabs.find(tab => tab.isActive);
  const language = activeTab ? getLanguageFromFile(activeTab.name) : 'plaintext';
  const roomId = activeTab && enableCollaboration ? `${repoId}-${activeTab.path}` : '';

  // Monaco Editor 훅
  const {
    editorRef,
    monacoEditorRef,
    editorContainerRef,
    handleEditorDidMount,
    handleEditorChange,
  } = useMonacoEditor({
    language,
    onSave: saveContent,
    onContentChange: updateContent,
    enableCollaboration,
  });

  // Yjs 협업 훅
  const { isConnected, isLoading } = useYjsCollaboration({
    roomId,
    editor: editorRef.current,
    userId,
    userName,
    enabled: enableCollaboration && Boolean(activeTab),
  });

  // 활성 탭이 없는 경우 플레이스홀더 표시
  if (!activeTab) {
    return (
      <EditorPlaceholder
        enableCollaboration={enableCollaboration}
        isConnected={isConnected}
        isLoading={isLoading}
      />
    );
  }

  // Monaco Editor 옵션
  const editorOptions = getMonacoEditorOptions(language, isDarkMode);

  return (
    <div className={styles.collaborativeEditor}>
      {/* 협업 상태 표시 */}
      {enableCollaboration && isConnected && <CollaborationStatus userCount={users.length + 1} />}

      <div className={styles.editorContainer} ref={editorContainerRef}>
        <Editor
          height="100%"
          language={language}
          value={enableCollaboration ? undefined : activeTab.content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
          loading={
            <div className={styles.editorLoading}>
              <div className={styles.loadingSpinner} />
              <span>에디터 로딩 중...</span>
            </div>
          }
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
