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

  // 일반 모드에서 탭 내용 변경 감지 및 에디터 업데이트
  useEffect(() => {
    // 협업 모드가 아닐 때만 실행
    if (enableCollaboration || !activeTab || !editorRef.current) return;

    // Monaco Editor의 타입 정의
    interface MonacoEditorMethods {
      getValue(): string;
      setValue(value: string): void;
    }

    // 안전하게 에디터 값 가져오기
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

    // 안전하게 에디터 값 설정하기
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

    // 에디터가 비어있고 탭에 내용이 있을 때만 업데이트 (덮어쓰기 방지)
    if (currentEditorValue === '' && tabContent !== '') {
      console.log('일반 모드 - 빈 에디터에 탭 내용 로드:', {
        tabId: activeTab.id,
        fileName: activeTab.name,
        tabContentLength: tabContent.length,
        editorContentLength: currentEditorValue.length,
      });

      setEditorValue(tabContent);

      // 에디터 스토어도 동기화
      updateContent(tabContent);

      console.log('일반 모드 - 에디터 내용 업데이트 완료:', {
        tabId: activeTab.id,
        contentLength: tabContent.length,
      });
    } else if (currentEditorValue !== tabContent && tabContent !== '') {
      // 내용이 다르고 탭에 내용이 있으면 탭 내용으로 업데이트
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
    enableCollaboration, // 협업 모드 변경 감지
    updateContent,
    editorRef,
  ]);

  // 에디터 변경 이벤트 핸들러 - 로딩 상태 확인 추가
  const onEditorChange = useCallback(
    (value: string | undefined) => {
      // 탭이 로딩 중이면 무시
      if (activeTab?.isLoading) {
        console.log('탭 로딩 중 - onChange 무시:', { tabId: activeTab.id });
        return;
      }

      if (value !== undefined && activeTab && value !== (activeTab.content || '')) {
        // 빈 내용으로 변경하는 경우 매우 신중하게 처리
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
    [handleEditorChange, activeTab?.id, activeTab?.content, activeTab?.isLoading]
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
        isLoading: activeTab.isLoading,
      });
    }
  }, [activeTab?.id, enableCollaboration, shouldUseCollaboration, roomId, isConnected, activeTab]);

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
      {enableCollaboration && (
        <div className={styles.collaborationHeader}>
          {isConnected && <CollaborationStatus userCount={users.length + 1} />}
          {isLoading && <div className={styles.connectionStatus}>협업 모드 연결 중...</div>}
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
          key={activeTab.id}
          value={activeTab.content || ''}
          onChange={onEditorChange}
          onMount={handleEditorDidMount}
          options={{
            ...editorOptions,
            // 협업 모드에서는 읽기 전용 설정을 조정, 로딩 중에도 읽기 전용
            readOnly: (enableCollaboration && isLoading) || activeTab.isLoading,
          }}
          theme={isDarkMode ? 'vs-dark' : 'vs'}
        />
      </div>
    </div>
  );
};

export default MonacoCollaborativeEditor;
