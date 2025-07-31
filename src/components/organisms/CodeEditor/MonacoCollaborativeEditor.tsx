import React, { useCallback } from 'react';
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
  repositoryId: number;
  enableCollaboration?: boolean;
  userId?: string;
  userName?: string;
}

const MonacoCollaborativeEditor: React.FC<MonacoCollaborativeEditorProps> = ({
  repoId,
  repositoryId,
  enableCollaboration = true,
  userId = `user-${Date.now()}`,
  userName = 'Anonymous',
}) => {
  const { updateContent } = useEditorStore();
  const { openTabs, setTabContent } = useTabStore();
  const { users } = useCollaborationStore();
  const { isDarkMode } = useThemeStore();

  // 활성 탭 정보
  const activeTab = openTabs.find(tab => tab.isActive);
  const language = activeTab ? getLanguageFromFile(activeTab.name) : 'plaintext';
  const roomId = activeTab && enableCollaboration ? `${repoId}-${activeTab.path}` : '';

  console.log('MonacoCollaborativeEditor 렌더:', {
    repoId,
    repositoryId,
    activeTab: activeTab
      ? {
          id: activeTab.id,
          name: activeTab.name,
          isDirty: activeTab.isDirty,
          contentLength: activeTab.content?.length || 0,
        }
      : null,
    enableCollaboration,
  });

  // 에디터 내용 변경 핸들러
  const handleContentChange = useCallback(
    (content: string) => {
      if (!activeTab) return;

      console.log('에디터 내용 변경:', {
        tabId: activeTab.id,
        contentLength: content.length,
        isDirty: activeTab.isDirty,
      });

      // 에디터 스토어 업데이트
      updateContent(content);

      // 탭 스토어 업데이트
      setTabContent(activeTab.id, content);
    },
    [activeTab, updateContent, setTabContent]
  );

  // Monaco Editor 훅 (협업 모드에서도 저장 기능 활성화)
  const {
    editorRef,
    monacoEditorRef,
    editorContainerRef,
    handleEditorDidMount,
    handleEditorChange,
    isSaving,
  } = useMonacoEditor({
    language,
    repositoryId,
    onContentChange: handleContentChange,
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

  // 에디터 변경 이벤트 핸들러
  const onEditorChange = useCallback(
    (value: string | undefined) => {
      console.log('Monaco 에디터 onChange:', {
        activeTabId: activeTab?.id,
        valueLength: value?.length || 0,
        enableCollaboration,
      });

      // activeTabId를 전달하여 저장 기능 활성화 (협업 모드에서도)
      handleEditorChange(value, activeTab?.id);
    },
    [handleEditorChange, activeTab?.id, enableCollaboration]
  );

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

      {/* 저장 상태 표시 (협업 모드에서도 표시하도록 수정) */}
      {isSaving && (
        <div className={styles.saveStatus}>
          <div className={styles.savingIndicator}>
            <span className={styles.savingSpinner} />
            저장 중...
          </div>
        </div>
      )}

      <div className={styles.editorContainer} ref={editorContainerRef}>
        <Editor
          height="100%"
          language={language}
          value={activeTab.content || ''}
          onChange={onEditorChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
          theme={isDarkMode ? 'vs-dark' : 'vs'}
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
