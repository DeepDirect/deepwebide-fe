import React, { useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { useYjsCollaboration } from '@/hooks/repo/useYjsCollaboration';
import { useMonacoEditor } from '@/hooks/repo/useMonacoEditor';
import { useEditorStore } from '@/stores/editorStore';
import { useTabStore } from '@/stores/tabStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { getLanguageFromFile } from '@/utils/fileExtensions';
import { getMonacoEditorOptions } from '@/utils/monacoUtils';
import CursorOverlay from '@/components/organisms/CursorOverlay/CursorOverlay';
import CollaborationStatus from '@/components/molecules/CollaborationStatus/CollaborationStatus';
import EditorPlaceholder from './EditorPlaceholder';
import type { MonacoEditorInstance } from '@/types/repo/yjs.types';
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
  enableCollaboration = false, // 기본값을 false로 변경
  userId,
  userName,
}) => {
  const { updateContent } = useEditorStore();
  const { openTabs, setTabContent } = useTabStore();
  const { users, currentUser } = useCollaborationStore();
  const { getUserInfo } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  // 활성 탭 정보
  const activeTab = openTabs.find(tab => tab.isActive);
  const language = activeTab ? getLanguageFromFile(activeTab.name) : 'plaintext';

  // 협업 모드가 활성화되어 있을 때만 룸 ID 생성
  const roomId = activeTab && enableCollaboration ? `repo-${repoId}-${activeTab.path}` : '';

  // 협업 모드가 비활성화되어 있으면 Yjs 관련 기능 완전 비활성화
  const shouldUseCollaboration = enableCollaboration && Boolean(activeTab) && Boolean(roomId);

  // 사용자 정보 설정 (협업 모드일 때만) - authStore nickname 우선 사용
  const authUser = getUserInfo();
  const finalUserId = userId || currentUser.id || String(authUser?.id) || `user-${Date.now()}`;
  const finalUserName =
    userName || currentUser.name || authUser?.nickname || authUser?.username || 'Anonymous';

  // 에디터 내용 변경 핸들러
  const handleContentChange = useCallback(
    (content: string) => {
      if (!activeTab) return;

      // 에디터 스토어 업데이트
      updateContent(content);

      // 탭 스토어 업데이트
      setTabContent(activeTab.id, content);
    },
    [activeTab, updateContent, setTabContent]
  );

  // Monaco Editor 훅
  const { editorRef, editorContainerRef, handleEditorDidMount, handleEditorChange, isSaving } =
    useMonacoEditor({
      language,
      repositoryId,
      onContentChange: handleContentChange,
      enableCollaboration: shouldUseCollaboration, // 정확한 협업 상태 전달
    });

  // Yjs 협업 훅 - 협업 모드일 때만 활성화
  const { isConnected, isLoading, error } = useYjsCollaboration({
    roomId,
    editor: editorRef.current as unknown as MonacoEditorInstance | null,
    userId: finalUserId,
    userName: finalUserName,
    enabled: shouldUseCollaboration, // 협업이 필요할 때만 활성화
  });

  // 에디터 변경 이벤트 핸들러
  const onEditorChange = useCallback(
    (value: string | undefined) => {
      // activeTabId를 전달하여 저장 기능 활성화 (협업 모드에서도)
      handleEditorChange(value, activeTab?.id);
    },
    [handleEditorChange, activeTab?.id]
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
            monacoEditor={editorRef.current as unknown as MonacoEditorInstance | null | undefined}
          />
        )}

        <Editor
          height="100%"
          language={language}
          // 협업 모드에서도 초기 내용은 표시하되, Yjs 연결 후 제어권 이양
          value={enableCollaboration && isConnected ? undefined : activeTab.content || ''}
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
