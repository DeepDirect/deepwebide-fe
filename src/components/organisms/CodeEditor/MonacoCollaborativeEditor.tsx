import React, { useCallback, useEffect } from 'react';
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
  enableCollaboration = false,
  userId,
  userName,
}) => {
  const { updateContent } = useEditorStore();
  const { openTabs, setTabContent, setTabDirty } = useTabStore();
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

      console.log('에디터 내용 변경:', {
        tabId: activeTab.id,
        contentLength: content.length,
        enableCollaboration,
        isDirty: content !== (activeTab.content || ''),
      });

      // 에디터 스토어 업데이트
      updateContent(content);

      // 탭 스토어 업데이트 (협업 모드에서는 Yjs가 관리하므로 dirty 상태만 업데이트)
      if (enableCollaboration) {
        // 협업 모드: Yjs가 탭 내용을 관리하므로 dirty 상태만 설정
        const isDirty = content !== (activeTab.content || '');
        if (isDirty) {
          setTabDirty(activeTab.id, true);
        }
      } else {
        // 일반 모드: 탭 내용과 dirty 상태 모두 업데이트
        setTabContent(activeTab.id, content);
        setTabDirty(activeTab.id, true);
      }
    },
    [activeTab, updateContent, setTabContent, setTabDirty, enableCollaboration]
  );

  // Monaco Editor 훅
  const { editorRef, editorContainerRef, handleEditorDidMount, handleEditorChange, isSaving } =
    useMonacoEditor({
      language,
      repositoryId,
      onContentChange: handleContentChange,
      enableCollaboration: shouldUseCollaboration,
    });

  // Yjs 협업 훅 - 협업 모드일 때만 활성화
  const { isConnected, isLoading, error } = useYjsCollaboration({
    roomId,
    editor: editorRef.current as unknown as MonacoEditorInstance | null,
    userId: finalUserId,
    userName: finalUserName,
    enabled: shouldUseCollaboration,
  });

  // 에디터 변경 이벤트 핸들러
  const onEditorChange = useCallback(
    (value: string | undefined) => {
      console.log('Monaco onChange 이벤트:', {
        valueLength: value?.length || 0,
        tabId: activeTab?.id,
        enableCollaboration,
        isConnected,
      });

      // activeTabId를 전달하여 저장 기능 활성화
      handleEditorChange(value, activeTab?.id);
    },
    [handleEditorChange, activeTab?.id, enableCollaboration, isConnected]
  );

  // 협업 모드 상태 로깅
  useEffect(() => {
    if (activeTab) {
      console.log('MonacoCollaborativeEditor 상태:', {
        tabId: activeTab.id,
        tabPath: activeTab.path,
        enableCollaboration,
        shouldUseCollaboration,
        roomId,
        isConnected,
        contentLength: activeTab.content?.length || 0,
      });
    }
  }, [activeTab?.id, enableCollaboration, shouldUseCollaboration, roomId, isConnected]);

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

  // 에디터 value 결정 로직
  const getEditorValue = () => {
    if (enableCollaboration) {
      // 협업 모드: 연결되기 전까지는 탭 내용 표시, 연결 후에는 Yjs가 제어
      return isConnected ? undefined : activeTab.content || '';
    } else {
      // 일반 모드: 항상 탭 내용 표시
      return activeTab.content || '';
    }
  };

  return (
    <div className={styles.collaborativeEditor}>
      {/* 협업 상태 표시 */}
      {enableCollaboration && (
        <div className={styles.collaborationHeader}>
          {isConnected && <CollaborationStatus userCount={users.length + 1} />}
          {isLoading && (
            <div className={styles.connectionStatus}>
              <span className={styles.loadingSpinner} />
              협업 모드 연결 중...
            </div>
          )}
        </div>
      )}

      {/* 에러 표시 */}
      {enableCollaboration && error && (
        <div className={styles.errorStatus}>
          <span className={styles.errorIcon}>!</span>
          <span className={styles.errorMessage}>{error}</span>
          <button className={styles.retryButton} onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      )}

      {/* 저장 상태 표시 */}
      {isSaving && (
        <div className={styles.saveStatus}>
          <div className={styles.savingIndicator}>
            <span className={styles.savingSpinner} />
            <span>저장 중...</span>
            {enableCollaboration && <span className={styles.saveMode}>(협업 모드)</span>}
          </div>
        </div>
      )}

      <div className={styles.editorContainer} ref={editorContainerRef}>
        {/* 커서 오버레이 (협업 모드에서만) */}
        {enableCollaboration && isConnected && (
          <CursorOverlay
            editorContainer={editorContainerRef.current}
            monacoEditor={editorRef.current as unknown as MonacoEditorInstance | null | undefined}
          />
        )}

        <Editor
          height="100%"
          language={language}
          value={getEditorValue()}
          onChange={onEditorChange}
          onMount={handleEditorDidMount}
          options={{
            ...editorOptions,
            // 협업 모드에서는 읽기 전용 설정을 조정
            readOnly: enableCollaboration && isLoading,
          }}
          theme={isDarkMode ? 'vs-dark' : 'vs'}
        />
      </div>
    </div>
  );
};

export default MonacoCollaborativeEditor;
