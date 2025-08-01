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
  userId,
  userName,
}) => {
  const { updateContent } = useEditorStore();
  const { openTabs, setTabContent } = useTabStore();
  const { users, currentUser } = useCollaborationStore();
  const { isDarkMode } = useThemeStore();

  // 활성 탭 정보
  const activeTab = openTabs.find(tab => tab.isActive);
  const language = activeTab ? getLanguageFromFile(activeTab.name) : 'plaintext';

  // 룸 ID 패턴 수정: "repo-{repoId}-{filePath}" 형태
  const roomId = activeTab && enableCollaboration ? `repo-${repoId}-${activeTab.path}` : '';

  // 사용자 정보 설정 (현재 사용자 또는 기본값)
  const finalUserId = userId || currentUser.id || `user-${Date.now()}`;
  const finalUserName = userName || currentUser.name || 'Anonymous';

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
    roomId,
    userCount: users.length,
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
  const { editorRef, editorContainerRef, handleEditorDidMount, handleEditorChange, isSaving } =
    useMonacoEditor({
      language,
      repositoryId,
      onContentChange: handleContentChange,
      enableCollaboration,
    });

  // Yjs 협업 훅
  const { isConnected, isLoading, error } = useYjsCollaboration({
    roomId,
    editor: editorRef.current,
    userId: finalUserId,
    userName: finalUserName,
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

      {/* 에러 표시 */}
      {enableCollaboration && error && (
        <div className={styles.errorStatus}>
          <span className={styles.errorIcon}>!</span>
          {error}
        </div>
      )}

      {/* 저장 상태 표시 (협업 모드에서도 표시) */}
      {isSaving && (
        <div className={styles.saveStatus}>
          <div className={styles.savingIndicator}>
            <span className={styles.savingSpinner} />
            저장 중...
          </div>
        </div>
      )}

      <div className={styles.editorContainer} ref={editorContainerRef}>
        {/* 커서 오버레이 */}
        {enableCollaboration && isConnected && (
          <CursorOverlay
            editorContainer={editorContainerRef.current}
            monacoEditor={editorRef.current}
          />
        )}

        <Editor
          height="100%"
          language={language}
          // 협업 모드에서는 value를 undefined로 설정하여 Yjs가 완전 제어
          value={enableCollaboration ? undefined : activeTab.content || ''}
          onChange={onEditorChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
          theme={isDarkMode ? 'vs-dark' : 'vs'}
        />
      </div>
    </div>
  );
};

export default MonacoCollaborativeEditor;
