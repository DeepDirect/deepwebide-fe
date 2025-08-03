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

  const activeTab = openTabs.find(tab => tab.isActive);
  const language = activeTab ? getLanguageFromFile(activeTab.name) : 'plaintext';

  const roomId = activeTab && enableCollaboration ? `repo-${repoId}-${activeTab.path}` : '';

  const shouldUseCollaboration = enableCollaboration && Boolean(activeTab) && Boolean(roomId);

  const authUser = getUserInfo();
  const finalUserId = userId || currentUser.id || String(authUser?.id) || `user-${Date.now()}`;
  const finalUserName =
    userName || currentUser.name || authUser?.nickname || authUser?.username || 'Anonymous';

  const isTabReadOnly = activeTab && (activeTab.isDeleted || activeTab.hasFileTreeMismatch);

  const handleContentChange = useCallback(
    (content: string) => {
      if (!activeTab || isTabReadOnly) return;

      console.log('에디터 내용 변경:', {
        tabId: activeTab.id,
        contentLength: content.length,
        enableCollaboration,
        isDirty: content !== (activeTab.content || ''),
      });

      updateContent(content);

      if (enableCollaboration) {
        const isDirty = content !== (activeTab.content || '');
        if (isDirty) {
          setTabDirty(activeTab.id, true);
        }
      } else {
        setTabContent(activeTab.id, content);
        setTabDirty(activeTab.id, true);
      }
    },
    [activeTab, updateContent, setTabContent, setTabDirty, enableCollaboration, isTabReadOnly]
  );

  const { editorRef, editorContainerRef, handleEditorDidMount, handleEditorChange, isSaving } =
    useMonacoEditor({
      language,
      repositoryId,
      onContentChange: handleContentChange,
      enableCollaboration: shouldUseCollaboration,
    });

  const { isConnected, isLoading, error } = useYjsCollaboration({
    roomId,
    editor: editorRef.current as unknown as MonacoEditorInstance | null,
    userId: finalUserId,
    userName: finalUserName,
    enabled: shouldUseCollaboration && !isTabReadOnly,
  });

  useEffect(() => {
    if (enableCollaboration || !activeTab || !editorRef.current) return;

    interface MonacoEditorMethods {
      getValue(): string;
      setValue(value: string): void;
    }

    const getEditorValue = (): string => {
      try {
        const editor = editorRef.current as unknown as MonacoEditorMethods;
        if (editor && typeof editor.getValue === 'function') {
          return editor.getValue() || '';
        }
      } catch (error) {
        console.warn('에디터 값 가져오기 실패:', error);
      }
      return '';
    };

    const setEditorValue = (value: string): void => {
      try {
        const editor = editorRef.current as unknown as MonacoEditorMethods;
        if (editor && typeof editor.setValue === 'function') {
          editor.setValue(value);
        }
      } catch (error) {
        console.warn('에디터 값 설정 실패:', error);
      }
    };

    const currentEditorValue = getEditorValue();
    const tabContent = activeTab.content || '';

    if (activeTab.isDeleted || activeTab.hasFileTreeMismatch) {
      if (currentEditorValue !== tabContent) {
        console.log('읽기 전용 탭 내용 즉시 업데이트:', {
          tabId: activeTab.id,
          isDeleted: activeTab.isDeleted,
          hasFileTreeMismatch: activeTab.hasFileTreeMismatch,
        });
        setEditorValue(tabContent);
        updateContent(tabContent);
      }
      return;
    }

    if (currentEditorValue === '' && tabContent !== '') {
      console.log('일반 모드 - 빈 에디터에 탭 내용 로드:', {
        tabId: activeTab.id,
        fileName: activeTab.name,
        tabContentLength: tabContent.length,
        editorContentLength: currentEditorValue.length,
      });

      setEditorValue(tabContent);
      updateContent(tabContent);

      console.log('일반 모드 - 에디터 내용 업데이트 완료:', {
        tabId: activeTab.id,
        contentLength: tabContent.length,
      });
    } else if (currentEditorValue !== tabContent && tabContent !== '') {
      console.log('일반 모드 - 탭 내용과 에디터 동기화:', {
        tabId: activeTab.id,
        fileName: activeTab.name,
        tabContentLength: tabContent.length,
        editorContentLength: currentEditorValue.length,
      });

      setEditorValue(tabContent);
      updateContent(tabContent);
    }
  }, [
    activeTab?.content,
    activeTab?.id,
    activeTab?.name,
    activeTab?.isDeleted,
    activeTab?.hasFileTreeMismatch,
    enableCollaboration,
    updateContent,
    editorRef,
  ]);

  const onEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeTab?.isLoading || isTabReadOnly) {
        console.log('탭 로딩 중이거나 읽기 전용 - onChange 무시:', {
          tabId: activeTab?.id,
          isLoading: activeTab?.isLoading,
          isReadOnly: isTabReadOnly,
        });
        return;
      }

      if (value !== undefined && activeTab && value !== (activeTab.content || '')) {
        if (value === '' && (activeTab.content || '').length > 0) {
          console.warn('빈 내용으로 변경 시도 - 검증 필요:', {
            tabId: activeTab.id,
            previousLength: activeTab.content?.length || 0,
          });
        }

        console.log('실제 내용 변경 감지:', {
          valueLength: value?.length || 0,
          tabId: activeTab?.id,
          previousLength: activeTab.content?.length || 0,
        });

        handleEditorChange(value, activeTab?.id);
      }
    },
    [handleEditorChange, activeTab?.id, activeTab?.content, activeTab?.isLoading, isTabReadOnly]
  );

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
        isLoading: activeTab.isLoading,
        isDeleted: activeTab.isDeleted,
        hasFileTreeMismatch: activeTab.hasFileTreeMismatch,
        isReadOnly: isTabReadOnly,
      });
    }
  }, [
    activeTab?.id,
    enableCollaboration,
    shouldUseCollaboration,
    roomId,
    isConnected,
    activeTab,
    isTabReadOnly,
  ]);

  if (!activeTab) {
    return (
      <EditorPlaceholder
        enableCollaboration={enableCollaboration}
        isConnected={isConnected}
        isLoading={isLoading}
      />
    );
  }

  const editorOptions = getMonacoEditorOptions(language, isDarkMode);

  return (
    <div className={styles.collaborativeEditor}>
      {enableCollaboration && (
        <div className={styles.collaborationHeader}>
          {isConnected && <CollaborationStatus userCount={users.length + 1} />}
          {isLoading && <div className={styles.connectionStatus}>협업 모드 연결 중...</div>}
        </div>
      )}

      {enableCollaboration && error && (
        <div className={styles.errorStatus}>
          <span className={styles.errorIcon}>!</span>
          <span className={styles.errorMessage}>{error}</span>
          <button className={styles.retryButton} onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      )}

      {isTabReadOnly && (
        <div className={styles.readOnlyStatus}>
          <span className={styles.readOnlyIcon}>🔒</span>
          <span className={styles.readOnlyMessage}>
            {activeTab.isDeleted
              ? '이 파일은 삭제되었습니다. 파일트리에서 다른 파일을 선택해주세요.'
              : '이 파일의 위치 또는 이름이 변경되었습니다. 파일트리에서 다시 한번 선택해주세요.'}
          </span>
        </div>
      )}

      {isSaving && !isTabReadOnly && (
        <div className={styles.saveStatus}>
          <div className={styles.savingIndicator}>
            <span className={styles.savingSpinner} />
            <span>저장 중...</span>
            {enableCollaboration && <span className={styles.saveMode}>(협업 모드)</span>}
          </div>
        </div>
      )}

      <div className={styles.editorContainer} ref={editorContainerRef}>
        {enableCollaboration && isConnected && !isTabReadOnly && (
          <CursorOverlay
            editorContainer={editorContainerRef.current}
            monacoEditor={editorRef.current as unknown as MonacoEditorInstance | null | undefined}
          />
        )}

        <Editor
          height="100%"
          language={language}
          key={activeTab.id}
          value={activeTab.content || ''}
          onChange={onEditorChange}
          onMount={handleEditorDidMount}
          options={{
            ...editorOptions,
            readOnly: (enableCollaboration && isLoading) || activeTab.isLoading || isTabReadOnly,
          }}
          theme={isDarkMode ? 'vs-dark' : 'vs'}
        />
      </div>
    </div>
  );
};

export default MonacoCollaborativeEditor;
